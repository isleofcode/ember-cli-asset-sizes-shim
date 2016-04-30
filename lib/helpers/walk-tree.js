var chalk = require("chalk");
var path = require("path");
var fs = require("fs");
var debug = require('debug')('asset-sizes:walk');

module.exports = function walkTree(src, callback, leaf) {
  debug(leaf ? chalk.grey(leaf) : chalk.cyan('Tree Root ') + chalk.grey(src));
  leaf = leaf || '';
  var fullPath = leaf ? path.join(src, leaf) : src;

  try {
    var stat = fs.statSync(fullPath);
  } catch (e) {
    debug(chalk.red('\t404 [ERROR] `' + fullPath + '`was not found.'));
    return;
  }

  if (stat) {

    if (stat.isDirectory()) {
      var dir = fs.readdirSync(fullPath);

      dir.forEach(function(name) {
        walkTree(src, callback, path.join(leaf, name));
      });
      return;
    }

    if (stat.isFile()) {
      callback({
        src: fullPath,
        stats: stat
      })
    }

  }
};
