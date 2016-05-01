var Plugin = require("broccoli-plugin");
var path = require("path");
var fs = require("fs");
var Promise = require("rsvp").Promise; // jshint ignore:line
var analyzePath = require('../helpers/analyze-path');
var debug = require('debug')('asset-sizes:tree-logger');
var chalk = require('chalk');
var copyFile = require('../helpers/copy-file');

// Create a subclass from Plugin
TreeLogger.prototype = Object.create(Plugin.prototype);
TreeLogger.prototype.constructor = TreeLogger;

function TreeLogger(inputNodes, options) {
  options = options || {
      annotation: "Tree Stats",
      cache: []
    };

  Plugin.call(this, inputNodes, {
    annotation: options.annotation
  });

  this.options = options;

}

TreeLogger.prototype.build = function buildLoggedTree() {
  var _self = this;
  debug(chalk.grey(this.options.annotation));

  if (this.inputPaths.length > 1) {
    debug(chalk.red('[' + this.annotation + '] Received too many input paths'));
  }

  var inputPath = this.inputPaths[0];
  var outputPath = path.join(this.outputPath);

  analyzePath(inputPath, inputPath, function(info) {
    _self.options.cache.push(info);
    copyFile(info.path, inputPath, outputPath);
  });

  return Promise.resolve();
};

module.exports = TreeLogger;
