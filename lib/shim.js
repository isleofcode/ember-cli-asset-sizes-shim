var chalk = require('chalk');
var AssetCache = require('./models/asset-cache');

function parseArgs() {
  var args = process.argv;
  var command = args[2];

  if (['b', 's', 'asset-sizes', 'build', 'serve'].indexOf(command) === -1) {
    return {
      traceAsset: false,
      assetSizes: false,
      traceAll: false
    }
  }

  var commands = ['--asset-sizes', '--trace-asset', '--trace-all'];
  var flagHash = {
    '-a': 'assetSizes',
    '-t': 'traceAsset',
    '-ta': 'traceAll',
    '--asset-sizes': 'assetSizes',
    '--trace-asset': 'traceAsset',
    '--trace-all': 'traceAll'
  };

  var options = {
    assetSizes: false,
    traceAsset: '',
    traceAll: false
  };

  for (var i = 3; i < args.length; i++) {
    var arg = args[i];
    var next = args[i + 1];

    // check if alias
    if (flagHash[arg]) {
      if (flagHash[next]) {
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

        if (assetCache.isActive) {
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

    if (this.options.addons.blacklist) {
      this.options.addons.blacklist.forEach(function(addonName) {
        if (addonNames.indexOf(addonName) === -1) {
          throw new Error('Addon "' + addonName + '" defined in blacklist is not found');
        }
      });
    }

    if (this.options.addons.whitelist) {
      this.options.addons.whitelist.forEach(function(addonName) {
        if (addonNames.indexOf(addonName) === -1) {
          throw new Error('Addon "' + addonName + '" defined in whitelist is not found');
        }
      });
    }

    this.project.addons = this.project.addons.filter(function(addon) {
      addon.app = this;

      if (this.shouldIncludeAddon(addon)) {
        if (addon.included) {
          includingFromAddon = addon.name;
          addon.included(this);
          includingFromAddon = false;
        }

        return addon;
      }
    }, this);
  };

};
