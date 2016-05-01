var chalk = require('chalk');
var AssetCache = require('./models/asset-cache');
var Funnel = require('broccoli-funnel');
var mergeTrees = require('broccoli-merge-trees');
var p = require('ember-cli-preprocess-registry/preprocessors');
var preprocessTemplates = p.preprocessTemplates;

var EOL = require('os').EOL;
var Babel  = require('broccoli-babel-transpiler');
var concat = require('broccoli-concat');
var merge = require('lodash/merge');
var path = require('path');
var debug = require('debug')('asset-sizes:app-shim');

function parseArgs() {
  debug('parsing args');
  var args = process.argv;
  var command = args[2];

  if (['a', 'asset-sizes'].indexOf(command) === -1) {
    return {
      traceAsset: false,
      assetSizes: false,
      traceAll: false
    }
  }

  var commands = ['--sizes', '--trace', '--trace-all'];
  var flagHash = {
    '-s': 'sizes',
    '-t': 'trace',
    '-ta': 'traceAll',
    '--sizes': 'sizes',
    '--trace': 'trace',
    '--trace-all': 'traceAll'
  };

  var options = {
    sizes: true,
    trace: '',
    traceAll: false
  };

  for (var i = 3; i < args.length; i++) {
    var arg = args[i];
    var next = args[i + 1];

    // check if alias
    if (flagHash[arg]) {
      if (!next || flagHash[next]) {
        options[flagHash[arg]] = true;
        continue;
      }
      options[flagHash[arg]] = next;
      i++;
      continue;
    }

    for (var j = 0; j < commands.length; j++) {
      var c = commands[j];

      if (arg.indexOf(c) === 0) {
        options[flagHash[c]] = c.substr(c.indexOf('='));
        break;
      }
    }

  }

  debug('args: ' + chalk.yellow(JSON.stringify(options)));
  return options;
}

module.exports = function shimEmberApp(EmberApp) {

  /*
    Assets collected along the way
   */
  var assetOptions = parseArgs();
  var assetCache = new AssetCache(assetOptions);

  /*
   Expose for us to abuse
   */
  EmberApp.prototype.__cacheForAssetStats = assetCache;


  /*
    Collect addon files
   */
  EmberApp.prototype.addonTreesFor = function(type) {
    var babelOptions = this._prunedBabelOptions();

    return this.project.addons.map(function(addon) {
      if (addon.treeFor) {
        var tree = addon.treeFor(type);

        if (assetCache.isActive && type !== 'templates' && type !== 'vendor') {
          return assetCache
            .lookup(addon.name)
            .observe(tree, type, { babel: babelOptions });
        }

        return tree;
      }
    }).filter(Boolean);
  };




  /*
   We override app.import to enable us to know the context in which
   a file was imported.
   */
  var importToApp = EmberApp.prototype.import;
  var includingFromAddon = false;

  EmberApp.prototype.import = function scopedImport(asset, options) {
    var importer = includingFromAddon || 'App';
    var assetPath = this._getAssetPath(asset);

    if (assetCache.isActive) {
      assetCache.lookup(importer)
        .lookup('imports')
        .push({
          asset: asset,
          path: assetPath,
          options: options
        });
    }

    return importToApp.call(this, asset, options);
  };


  /*
    We overwrite this to have it notify us of what addon is
    currently importing things.
   */
  EmberApp.prototype._notifyAddonIncluded = function() {
    this.initializeAddons();

    var addonNames = this.project.addons.map(function(addon) {
      return addon.name;
    });

    if (this.options && this.options.addons && this.options.addons.blacklist) {
      this.options.addons.blacklist.forEach(function(addonName) {
        if (addonNames.indexOf(addonName) === -1) {
          throw new Error('Addon "' + addonName + '" defined in blacklist is not found');
        }
      });
    }

    if (this.options && this.options.addons && this.options.addons.whitelist) {
      this.options.addons.whitelist.forEach(function(addonName) {
        if (addonNames.indexOf(addonName) === -1) {
          throw new Error('Addon "' + addonName + '" defined in whitelist is not found');
        }
      });
    }

    this.project.addons = this.project.addons.filter(function(addon) {
      addon.app = this;

      if (!this.shouldIncludeAddon || this.shouldIncludeAddon(addon)) {
        if (addon.included) {
          includingFromAddon = addon.name;
          addon.included(this);
          includingFromAddon = false;
        }

        return addon;
      }
    }, this);
  };



  /*
    We overwrite this to be able to individually load and pre-process templates.
   */
  var cachedProcessTemplatesTree = EmberApp.prototype._processedTemplatesTree;
  EmberApp.prototype._processedTemplatesTree = function() {
    if (assetCache.isActive) {
      cachedProcessTemplatesTree.call(this);
    }

    var _context = this;
    var babelOptions = this._prunedBabelOptions();

    function processTree(tree) {
      var templates = _context.addonPreprocessTree('template', tree);

      return _context.addonPostprocessTree('template', preprocessTemplates(templates, {
        registry: _context.registry,
        annotation: 'postprocessTree(templates)'
      }));
    }

    var addonTrees = this.project.addons.map(function(addon) {
      if (addon.treeFor) {
        var tree = addon.treeFor('templates');

        if (!tree) {
          return tree;
        }

        return assetCache
          .lookup(addon.name)
          .observe(processTree(tree), 'templates', { babel: babelOptions });
      }
    }).filter(Boolean);

    var mergedTemplates = mergeTrees(addonTrees, {
      overwrite: true,
      annotation: 'TreeMerger (templates)'
    });

    var addonTemplates = new Funnel(mergedTemplates, {
      srcDir: '/',
      destDir: this.name + '/templates',
      annotation: 'ProcessedTemplateTree'
    });

    var appTemplates = assetCache
      .lookup('App')
      .observe(processTree(this._templatesTree()), 'templates', { babel: babelOptions });

    return mergeTrees([
      addonTemplates,
      appTemplates
    ], {
      annotation: 'TreeMerger (pod & standard templates)',
      overwrite: true
    });

  };




  /*
    We do this to gain access to the final vendor tree
   */
  EmberApp.prototype.javascript = function hookedJavascriptTree() {
    var deprecate = this.project.ui.writeDeprecateLine.bind(this.project.ui);
    var applicationJs = this.appAndDependencies();
    var appOutputPath = this.options.outputPaths.app.js;
    var appJs = applicationJs;

    // Note: If ember-cli-babel is installed we have already performed the transpilation at this point
    if (!this._addonInstalled('ember-cli-babel')) {
      appJs = new Babel(
        new Funnel(applicationJs, {
          include: [escapeRegExp(this.name + '/') + '**/*.js'],
          annotation: 'Funnel: App JS Files'
        }),
        merge(this._prunedBabelOptions())
      );
    }

    appJs = mergeTrees([
      appJs,
      this._processedEmberCLITree()
    ], {
      annotation: 'TreeMerger (appJS  & processedEmberCLITree)',
      overwrite: true
    });

    appJs = this.concatFiles(appJs, {
      inputFiles: [this.name + '/**/*.js'],
      headerFiles: [
        'vendor/ember-cli/app-prefix.js'
      ],
      footerFiles: [
        'vendor/ember-cli/app-suffix.js',
        'vendor/ember-cli/app-config.js',
        'vendor/ember-cli/app-boot.js'
      ],
      outputFile: appOutputPath,
      annotation: 'Concat: App'
    });

    if (this.legacyFilesToAppend.length > 0) {
      deprecate('Usage of EmberApp.legacyFilesToAppend is deprecated. Please use EmberApp.import instead for the following files: \'' + this.legacyFilesToAppend.join('\', \'') + '\'');
      this.legacyFilesToAppend.forEach(function(legacyFile) {
        this.import(legacyFile);
      }.bind(this));
    }

    this.import('vendor/ember-cli/vendor-prefix.js', {prepend: true});
    this.import('vendor/addons.js');
    this.import('vendor/ember-cli/vendor-suffix.js');

    // this is the hook, we stash the Funnel so we can use it's output later
    // to calculate individual vendor import sizes
    var finalVendor = applicationJs;
    if (assetCache.isActive) {
     finalVendor = new Funnel(applicationJs, {});
      assetCache.finalVendor = finalVendor;
    }

    var vendorFiles = [];
    for (var outputFile in this._scriptOutputFiles) {
      var inputFiles = this._scriptOutputFiles[outputFile];

      vendorFiles.push(
        this.concatFiles(finalVendor, {
          inputFiles: inputFiles,
          outputFile: outputFile,
          separator: EOL + ';',
          annotation: 'Concat: Vendor ' + outputFile
        })
      );
    }

    return mergeTrees(vendorFiles.concat(appJs), {
      annotation: 'TreeMerger (vendor & appJS)'
    });
  };



  /*
    We return this in case we need to do anything else special like it
    (Hint: like pass it into the model shim)
   */

  return assetCache;

};
