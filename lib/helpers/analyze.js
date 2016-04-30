var chalk = require("chalk");
var path = require("path");
var fs = require("fs");
var zlib = require('zlib');
var CleanCSS = require('clean-css');
var uglifyFile = require('./uglify');
var merge = require('lodash/merge');
var debug = require('debug')('asset-sizes:analyze');

module.exports = function analyzeFile(info, callback, options) {
  options = merge({ minify: false, gzip: false }, options || {});

  debug(chalk.grey(info.src) + chalk.yellow(' ' + JSON.stringify(options)));
  var parsed = path.parse(info.src);

  if (parsed.ext === '.map') {
    debug(chalk.grey('Skipping analysis for .map file'));
    return;
  }

  var moduleName = parsed.name;
  var dirPath = parsed.dir;
  var realDirPath = dirPath.substr(info.root.length + 1);
  var realFilePath = path.join(realDirPath, parsed.base);

  var opts = { level: 9 };
  debug('reading file ' + chalk.white(realFilePath) + ' from ' + chalk.cyan(info.src));
  var fileString = '' // fs.readFileSync(info.src).toString();

  var gzipped = options.gzip ? zlib.gzipSync(fileString, opts) : '';
  var uglified = '';
  var both = '';

  var isJS = parsed.ext === '.js';
  var isCSS = parsed.ext === '.css';

  if (options.minify) {
    var uglifyOptions = {
      mangle: true,
      compress: true,
      sourceMapIncludeSources: false
    };

    if (isJS) {
      try {
        debug(chalk.white('[Analyze]'), chalk.yellow('Uglifying JS'));
        uglified = uglifyFile(info.src, uglifyOptions);
        both = zlib.gzipSync(uglified, opts);
      } catch (e) {
        debug(chalk.red('Uglify Failed, falling back to un-uglified values.'));
        uglified = fileString;
        both = gzipped
      }
    }

    if (isCSS) {
      debug(chalk.yellow('Minifying CSS'));
      uglified = new CleanCSS().minify(fileString).styles;
      both = zlib.gzipSync(uglified, opts);
    }
  }

  var sizes = {
    original: info.stats.size,
    gzipped: gzipped.length || info.stats.size,
    minified: uglified.length || info.stats.size,
    both: both.length || gzipped.length || info.stats.size,
    final: info.stats.size
  };

  if (options.gzip) {
    sizes.final = sizes.gzipped;
  }
  if (options.minify && (isJS || isCSS)) {
    sizes.final = sizes.both;
  }

  if (callback) {
    callback({
      name: moduleName,
      ext: parsed.ext,
      path: info.src,
      isJS: isJS,
      isCSS: isCSS,
      realDirPath: realDirPath,
      realFilePath: realFilePath,
      stats: info.stats,

      sizes: sizes
    });
  }

};
