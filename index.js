/* jshint node: true */
'use strict';
var chalk = require('chalk');
var analyze = require('./lib/helpers/analyze-path');
var logFile = require('./lib/helpers/log-file-stats');
var path = require('path');

module.exports = {
  name: 'ember-cli-asset-sizes-shim',

  included: function(app) {

    if (!app._wasShimmedForStats) {
      console.log(chalk.red('You should shim your app'));
    }

  },

  outputReady: function(result) {

    // asset analytics
    var AssetCache = this.app._assetAnalytics;
    var root = this.project.root;

    console.log(chalk.white('\nAddon Analytics\n=================='));
    Object.keys(AssetCache).forEach(function(addon) {
      var msgs = [];
      var Asset = AssetCache[addon];
      var sizes;
      var info;

      // app code
      if (Asset.app) {
        sizes = Asset.app.reduce(function (chain, info) {
          chain.total += info.stats.size;
          chain.gzipped += info.gzipped.length;
          chain.uglified += info.uglified.length;
          chain.both += info.both.length;

          return chain;
        }, {total: 0, gzipped: 0, uglified: 0, both: 0});
        info = {
          isJS: true,
          realFilePath: 'App Modules',
          stats: {size: sizes.total},
          gzipped: {length: sizes.gzipped},
          uglified: {length: sizes.uglified},
          both: {length: sizes.both}
        };
        if (sizes.total) {
          msgs.push(logFile(info, true));
        }
      }

      // addon code
      if (Asset.addon) {
        sizes = Asset.addon.reduce(function (chain, info) {
          chain.total += info.stats.size;
          chain.gzipped += info.gzipped.length;
          chain.uglified += info.uglified.length;
          chain.both += info.both.length;

          return chain;
        }, {total: 0, gzipped: 0, uglified: 0, both: 0});
        info = {
          isJS: true,
          realFilePath: 'Addon Modules',
          stats: {size: sizes.total},
          gzipped: {length: sizes.gzipped},
          uglified: {length: sizes.uglified},
          both: {length: sizes.both}
        };
        if (sizes.total) {
          msgs.push(logFile(info, true));
        }
      }

      // vendor / imported code (app.import)
      if (Asset.imports) {
        var imports = [];

        Asset.imports.forEach(function(item) {
          analyze(root, path.join(root, item.path), function(info) {
            imports.push(info);
          });
        });

        sizes = imports.reduce(function(chain, info) {
          chain.total += info.stats.size;
          chain.gzipped += info.gzipped.length;
          chain.uglified += info.uglified.length;
          chain.both += info.both.length;

          return chain;
        }, { total: 0, gzipped: 0, uglified: 0, both: 0 });
        info = {
          isJS: true,
          realFilePath: 'Vendor Imports',
          stats: { size: sizes.total },
          gzipped: { length: sizes.gzipped },
          uglified: { length: sizes.uglified },
          both: { length: sizes.both }
        };
        if (sizes.total) {
          msgs.push(logFile(info, true));
          imports.forEach(function(info) {
            if (info.stats.size) {
              var m = logFile(info, true, '  ');
              msgs.push(chalk.grey(chalk.stripColor(m)));
            }
          });

        }
      }

      // templates

      // styles

      if (msgs.length) {
        console.log(chalk.green(addon));
        msgs.forEach(function(msg) {
          console.log(msg);
        });
      }

    });

    console.log(chalk.white('\nFinal Build Analytics\n=================='));
    analyze(result.directory, result.directory, function(info) {
      logFile(info);
    });


  },

  isDevelopingAddon: function() {
    return true;
  }

};
