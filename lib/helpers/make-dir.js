/* jshint node: true */
var path = require("path");
var fs = require("fs");
var os = require('os')
var debug = require('debug')('asset-sizes:make-dir');

module.exports = function makeDir(dir) {
  debug(dir);
  var dirs = dir.split(path.sep);
  var base = path.sep === '/' ? '/' : '';

  dirs.forEach(function (segment) {
    if (segment) {
      // on win32 node doesn't put \ after drive letter in join
      if (os.platform() === 'win32' && segment.length === 2 && segment.indexOf(':') === 1) {
        segment += '\\';
      }
      base = path.join(base, segment);

      if (!fs.existsSync(base)) {
        debug('make: ', base);
        try {
          fs.mkdirSync(base);
        } catch (e) {
          if (e.code !== "EEXIST") {
            throw e;
          }
        }
      }
    }
  });
};
