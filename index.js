/* jshint node: true */
'use strict';
var chalk = require('chalk');
var analyze = require('./lib/helpers/analyze-path');
var logFile = require('./lib/helpers/log-file-stats');
var path = require('path');
var BuildCommand = require('./lib/commands/build');
var analyzeAddon = require('./lib/helpers/analyze-addon');

module.exports = {
  name: 'ember-cli-asset-sizes-shim',


  /*
    Alert the User to improper installs.
   */
  included: function(app) {
    if (!app._wasShimmedForStats) {
      console.log(
        chalk.yellow('[WARNING] Missing asset-sizes shim!\n') +
        chalk.grey(
            '\tThe addon ember-cli-asset-sizes-shim requires you to shim EmberApp.\n' +
            '\n\tPlace the following in your ember-cli-build.js file.\n\n') +
        chalk.green('var shim = require(\'ember-cli-asset-sizes-shim/lib/shim\');\n\nshim(EmberApp);')
      );
    }
  },


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
    // bail if we have no shim or process flags
    if (!this.app._wasShimmedForStats || !process._flags) {
      return;
    }

    var shouldAnalyzeAssests = process._flags.assetSizes;
    var assetToTrace = process._flags.traceAsset;

    // bail if the user didn't wan't us to log or trace anything
    if (!shouldAnalyzeAssests && !assetToTrace) {
      return;
    }

    // asset analytics
    var AssetCache = this.app._assetAnalytics;
    var root = this.project.root;

    console.log(chalk.white('\nAsset Analytics') + chalk.grey('\n––––––––––––––––––––––––––––'));

    Object.keys(AssetCache).forEach(function(addon) {
      analyzeAddon(addon, AssetCache[addon], {
        shouldLog: addon === assetToTrace,
        root: root
      });
    });

    console.log(chalk.white('\nFinal Build Analytics\n=================='));
    analyze(result.directory, result.directory, function(info) {
      logFile(info);
    });


  }

};
