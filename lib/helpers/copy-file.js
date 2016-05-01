var mkDir = require('./make-dir');
var path = require('path');
var fs = require('fs');
var debug = require('debug')('asset-sizes:copy-file');
var chalk = require('chalk');

module.exports = function copyFile(src, base, newBase) {
  var file = src.substr(base.length + 1);
  var dest = path.join(newBase, file);
  var destPath = path.parse(dest);

  mkDir(destPath.dir);
  debug('reading: ' + src);
  var f = fs.readFileSync(src, { encoding: 'utf8' });

  debug('writing: ' + dest);
  fs.writeFileSync(dest, f);
};
