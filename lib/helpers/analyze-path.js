var chalk = require("chalk");
var walkTree = require('./walk-tree');
var debug = require('debug')('asset-sizes:analyze-path');
var analyzeFile = require('./analyze');

module.exports = function analyzePath(projectRoot, srcPath, callback, options) {
  debug(chalk.white(srcPath));
  walkTree(srcPath, function(info) {
    info.root = projectRoot;
    analyzeFile(info, callback, options);
  });
};
