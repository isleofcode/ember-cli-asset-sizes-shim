var Plugin = require("broccoli-plugin");
var path = require("path");
var fs = require("fs");
var Promise = require("rsvp").Promise; // jshint ignore:line
var makeDir = require("../helpers/make-dir");
var analyze = require('../helpers/analyze-path');
var chalk = require('chalk');
var walkTree = require('../helpers/walk-tree');

// Create a subclass from Plugin
TreeLogger.prototype = Object.create(Plugin.prototype);
TreeLogger.prototype.constructor = TreeLogger;

function TreeLogger(inputNodes, options) {
  options = options || {
      annotation: "Tree Stats",
      cache: {}
    };
  this.options = options;

  Plugin.call(this, inputNodes, {
    annotation: options.annotation
  });
}

TreeLogger.prototype.build = function () {
  var _self = this;

  this.inputPaths.forEach(function(currentPath) {
    var pathInfo = {
      base: currentPath,
      output: _self.outputPath
    };

    analyze(currentPath, currentPath, function(info) {
      _self.options.cache.push(info);

      // move the file
      var dest = path.join(pathInfo.output, info.realFilePath);
      makeDir(pathInfo.output, info.realDirPath);
      fs.writeFileSync(dest, info.file);

    });
  });

  return Promise.resolve();
};

module.exports = TreeLogger;
