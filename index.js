/* jshint node: true */
'use strict';
var chalk = require('chalk');
var analyze = require('./lib/helpers/analyze-path');
var logFile = require('./lib/helpers/log-file-stats');
var path = require('path');
var BuildCommand = require('./lib/commands/build');
var shim = require('./lib/shim');

module.exports = {
  name: 'ember-cli-asset-sizes-shim',

  /*
    We override default commands to add tracing flags and expose them to the environment
   */
  includedCommands: function() {
    return {
      build: BuildCommand
    }
  },


  /*
   Make sure this returns false before publishing
   */
  isDevelopingAddon: function() {
    return true;
  },


  /*
    We use output ready to do the analysis so that we have access to the final build as well.
   */
  outputReady: function(result) {
    var assetCache = this.app.__cacheForAssetStats;

    // bail if the user didn't wan't us to log or trace anything
    if (!assetCache.isActive) {
      console.log('bailing because inactive');
      return;
    }

    // asset analytics
    console.log(chalk.white('\nAsset Analytics') + chalk.grey('\n––––––––––––––––––––––––––––'));

    assetCache._options.root = this.project.root;
    assetCache.analyze();

    if (assetCache._options.logAssets) {
      console.log(chalk.white('\nFinal Build Analytics\n=================='));
      var logs = [];

      analyze(result.directory, result.directory, function(info) {
        logs.push(info);
      });

      logs.sort(function compare(a, b) {
        if (a.stats.size > b.stats.size) {
          return -1;
        }
        if (a.stats.size < b.stats.size) {
          return 1;
        }
        // a must be equal to b
        return 0;
      });

      logs.forEach(function(log) {
        logFile(log);
      });

    }

  },

  init: function() {
    if (this._super && this._super.apply) {
      this._super.apply(this, arguments);
    }

    var pathToApp = path.join(this.project.root, 'node_modules/ember-cli/lib/broccoli/ember-app');
    var EmberApp = require(pathToApp);

    shim(EmberApp);
  }

};
