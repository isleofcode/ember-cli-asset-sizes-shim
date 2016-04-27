var chalk = require("chalk");
var path = require("path");
var fs = require("fs");
var uglify = require('uglify-js');
var filesize = require('filesize');
var zlib = require('zlib');

function getHumanSize(size) {
  return filesize(size);
}

module.exports = function analyzePath(projectRoot, path, callback) {
  var stat = fs.statSync(path);

  if (stat) {

    if (stat.isDirectory()) {
      var dir = fs.readdirSync(path);

      dir.forEach(function(name) {
        analyzePath(projectRoot, path.join(path, name), callback);
      });
      return;
    }

    if (stat.isFile()) {
      var parsed = path.parse(path);
      var moduleName = parsed.name;
      var dirPath = parsed.dir;
      var realDirPath = dirPath.substr(projectRoot.length + 1);
      var realFilePath = path.join(realDirPath, parsed.base);

      var opts = {level: 9};
      var file = fs.readFileSync(ref);
      var gzipped = zlib.gzipSync(file, opts);
      var uglified = uglify.minify(file, {fromString: true});
      var both = zlip.gzipSync(uglified, opts);

      console.log(
        '\t' + chalk.grey(realFilePath) + ' ' +
        chalk.yellow(
          '\tOriginal: ' + getHumanSize(stat.size) +
          '\tGzip: ' + getHumanSize(gzipped.length) +
          '\tMin: ' + getHumanSize(uglified.length) +
          '\tGzip + Min: ' + getHumanSize(both.length)
        )
      );

      if (callback) {
        callback({
          name: moduleName,
          ext: parsed.ext,
          path: path,
          realDirPath: realDirPath,
          realFilePath: realFilePath,
          stats: stat,
          file: file,
          uglified: uglified,
          gzipped: gzipped,
          both: both
        });
      }
    }

  }

};
