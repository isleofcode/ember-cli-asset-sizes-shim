var chalk = require("chalk");
var path = require("path");
var fs = require("fs");
var debug = require('debug')('asset-sizes:walk');

module.exports = function walkTree(src, callback, leaf) {
  if (!leaf) {
    debug(chalk.cyan('Walk: ') + chalk.white(src));
  }

  try {
    var stat = fs.statSync(src);
  } catch (e) {
    debug(chalk.red('\t404 [ERROR] `' + src + '`was not found.'));
    return;
  }

  if (stat) {

    if (stat.isDirectory()) {
      var dir = fs.readdirSync(src);

      dir.forEach(function(name) {
        walkTree(path.join(src, name), callback, true);
      });
      return;
    }

    if (stat.isFile()) {
      callback({
        src: src,
        stats: stat
      })
    }

  }
};
