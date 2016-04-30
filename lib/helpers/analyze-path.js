var chalk = require("chalk");
var path = require("path");
var fs = require("fs");
var zlib = require('zlib');
var CleanCSS = require('clean-css');
var uglifyFile = require('./uglify');
var walkTree = require('./walk-tree');

module.exports = function analyzePath(projectRoot, srcPath, callback) {
  walkTree(srcPath, function(info) {
    var parsed = path.parse(info.src);

    if (parsed.ext === '.map') {
      return;
    }

    var moduleName = parsed.name;
    var dirPath = parsed.dir;
    var realDirPath = dirPath.substr(projectRoot.length + 1);
    var realFilePath = path.join(realDirPath, parsed.base);

    var opts = {level: 9};
    var file = fs.readFileSync(info.src);
    var gzipped = zlib.gzipSync(file, opts);
    var uglified = '', both = '';
    var isJS = parsed.ext === '.js';
    var isCSS = parsed.ext === '.css';

    var options = {
      mangle: true,
      compress: true,
      sourceMapIncludeSources: false
    };

    if (isJS) {
      try {
        uglified = uglifyFile(info.src, options);
        both = zlib.gzipSync(uglified, opts);
      } catch (e) {
        uglified = file;
        both = gzipped
      }
    }

    if (isCSS) {
      uglified = new CleanCSS().minify(file).styles;
      both = zlib.gzipSync(uglified, opts);
    }

    if (callback) {
      callback({
        name: moduleName,
        ext: parsed.ext,
        path: info.src,
        realDirPath: realDirPath,
        realFilePath: realFilePath,
        stats: info.stats,
        file: file,
        uglified: uglified,
        gzipped: gzipped,
        both: both,
        isJS: isJS,
        isCSS: isCSS
      });
    }
  });

};
