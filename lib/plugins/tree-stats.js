var Plugin = require("broccoli-plugin");
var path = require("path");
var fs = require("fs");
var Promise = require("rsvp").Promise; // jshint ignore:line
var makeDir = require("../helpers/make-dir");
var analyze = require('../helpers/analyze-path');
var chalk = require('chalk');

// Create a subclass from Plugin
TreeStats.prototype = Object.create(Plugin.prototype);
TreeStats.prototype.constructor = TreeStats;

function TreeStats(inputNodes, options) {
  options = options || {
      annotation: "Vendor Stats"
    };
  this.options = options;

  Plugin.call(this, inputNodes, {
    annotation: options.annotation
  });
}

TreeStats.prototype.build = function () {
  var _self = this;
  var builtAll = [];

  console.log(chalk.white('\nTree Module Analytics\n=================='));

  this.inputPaths.forEach(function(currentPath) {
    var pathInfo = {
      base: currentPath,
      output: _self.outputPath
    };

    var printed = Promise.resolve(
      analyze(currentPath, currentPath, function(file) {
        // move the file
        var dest = path.join(pathInfo.output, file.realFilePath);
        makeDir(pathInfo.output, file.realDirPath);
        fs.writeFileSync(dest, file.file);
      })
    );

    builtAll.push(printed);
  });

  return Promise.all(builtAll);
};

module.exports = TreeStats;
