var uglify = require('uglify-js');
var chalk = require('chalk');
var debug = require('debug')('asset-sizes');

module.exports = function uglifyFile(src, options) {
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
    debug(chalk.red('\t[ERROR] `' + src + '`was unable to built for analytics and will not be included in the results.'));
    // throw e;
    return '';
  }
};
