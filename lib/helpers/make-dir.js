/* jshint node: true */
var path = require("path");
var fs = require("fs");
var debug = require('debug')('asset-sizes:make-dir');

module.exports = function makeDir(dir) {
  debug(dir);
  var dirs = dir.split("/");
  var base = '/';

  dirs.forEach(function(segment) {
    if (segment) {
      base = path.join(base, segment);
      debug('make: ', base);
      try {
        fs.mkdirSync(base);
      } catch (e) {
        if (e.code !== "EEXIST") {
          throw e;
        }
      }
    }
  });
};
