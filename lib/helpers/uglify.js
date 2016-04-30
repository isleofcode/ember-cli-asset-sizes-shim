var uglify = require('uglify-js');
var chalk = require('chalk');
var debug = require('debug')('asset-sizes:uglify');

module.exports = function uglifyFile(src, options) {
  debug(chalk.grey('Uglifying JS: ') + chalk.white(src));
  try {
    var start = new Date();
    var result = uglify.minify(src, options);
    var end = new Date();
    var total = end - start;

    if (total > 20000) {
      debug(chalk.yellow('\t[WARN] `' + src + '` took: ' + total + 'ms (more then 20,000ms)'));
    }

    return result.code;

  } catch(e) {
    e.filename = src;
    debug(
      chalk.yellow('[WARN] Unable to minify `' + src +
        '`.\nThe non-minified gzipped size will instead be used in the results') +
      chalk.grey('\tError: ' + e.message)
    );
    throw e;
  }
};
