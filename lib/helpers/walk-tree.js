var chalk = require("chalk");
var path = require("path");
var fs = require("fs");
var debug = require('debug')('asset-sizes');

module.exports = function walkTree(src, callback) {
  try {
    var stat = fs.statSync(src);
  } catch (e) {
    debug(chalk.red('\t[ERROR] `' + src + '`was unable to be walked.'));
    return;
  }

  if (stat) {

    if (stat.isDirectory()) {
      var dir = fs.readdirSync(src);

      dir.forEach(function(name) {
        walkTree(path.join(src, name), callback);
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
