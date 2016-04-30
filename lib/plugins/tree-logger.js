var Plugin = require("broccoli-plugin");
var path = require("path");
var fs = require("fs");
var Promise = require("rsvp").Promise; // jshint ignore:line
var analyzePath = require('../helpers/analyze-path');
var debug = require('debug')('asset-sizes:tree-logger');
var chalk = require('chalk');
var symlinkOrCopySync = require('symlink-or-copy').sync;

// Create a subclass from Plugin
TreeLogger.prototype = Object.create(Plugin.prototype);
TreeLogger.prototype.constructor = TreeLogger;

function TreeLogger(inputNode, options) {
  options = options || {
      annotation: "Tree Stats",
      cache: []
    };
  this.options = options;

  Plugin.call(this, [inputNode], {
    annotation: options.annotation
  });
}

TreeLogger.prototype.build = function() {
  var _self = this;
  debug(chalk.grey(this.options.annotation));

  if (this.inputPaths.length > 1) {
    debug(chalk.red('[' + this.annotation + '] Received too many input paths'));
  }

  var inputPath = this.inputPaths[0];
  var outputPath = path.join(this.outputPath, '0');

  /*
  analyzePath(inputPath, inputPath, function(info) {
    _self.options.cache.push(info);
  });
  */

  // symlink to new destination
  debug('Symlink: ' + inputPath + ' -> ' + outputPath);
  symlinkOrCopySync(inputPath, outputPath);

  return Promise.resolve();
};

module.exports = TreeLogger;
