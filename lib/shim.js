var path = require('path');
var TreeLogger = require('./plugins/tree-logger');
var mergeTrees = require('broccoli-merge-trees');
var chalk = require('chalk');
var Babel  = require('broccoli-babel-transpiler');
/*
function loopFiles(root, files) {
  for (var outputFileName in files) {
    console.log('\t Included Assets for: ' + outputFileName);
    for (var i = 0; i < files[outputFileName].length; i++) {
      // do stuff to log the size
      analyzePath(root, files[outputFileName][i]);
    }
  }
}
*/
module.exports = function shimEmberApp(EmberApp) {

  /*
    We use this to alert the user if they have failed to shim EmberApp
   */
  EmberApp.prototype._wasShimmedForStats = true;

  /*
    Assets collected along the way
   */
  var AssetCache = {};

  /*
   Expose for us to abuse
   */
  EmberApp.prototype._assetAnalytics = AssetCache;


  /*
    Collect addon files
   */
  EmberApp.prototype.addonTreesFor = function(type) {
    var babelOptions = this._prunedBabelOptions();

    return this.project.addons.map(function(addon) {
      if (addon.treeFor) {
        var tree = addon.treeFor(type);

        if (process._flags.traceAsset === addon.name || process._flags.assetSizes) {
          AssetCache[addon.name] = AssetCache[addon.name] || {};
          AssetCache[addon.name][type] = AssetCache[addon.name][type] || [];
          var cache = AssetCache[addon.name][type];

          if (tree && (type !== 'addon-test-support')) {
            var transpiled = tree;
            if (type === 'app' || type === 'addon') {
              transpiled = new Babel(mergeTrees([tree]), babelOptions);
            }

            return new TreeLogger([transpiled], { cache: cache, treeName: type, treeSource: addon.name });
          }
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

    if (process._flags.traceAsset === importer || process._flags.assetSizes) {
      var assetPath = this._getAssetPath(asset);

      AssetCache[importer] = AssetCache[importer] || {};
      AssetCache[importer].imports = AssetCache[importer].imports || [];
      AssetCache[importer].imports.push({
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
