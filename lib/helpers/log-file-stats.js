var chalk = require('chalk');
var filesize = require('filesize');

function getHumanSize(size) {
  return filesize(size);
}

module.exports = function logStats(stats, ret, prefix) {
  prefix = prefix || '';
  var smallest = stats.isJS || stats.isCSS ? stats.both.length : stats.gzipped.length;
  var smallColor = 'grey';
  if (smallest > 1024) {
    smallColor = 'white';
  }
  if (smallest > 1024 * 5) {
    smallColor = 'green';
  }
  if (smallest > (1024 * 10)) {
    smallColor = 'yellow';
  }
  if (smallest > (1024 * 50)) {
    smallColor = 'magenta';
  }
  if (smallest > (1024 * 500)) {
    smallColor = 'red';
  }

  var msg = prefix + chalk[smallColor](getHumanSize(smallest)) + '    ' + chalk.cyan(stats.realFilePath) + '  ' +
    chalk.grey(
      'Original: ' + getHumanSize(stats.stats.size) +
      ' gzip: ' + getHumanSize(stats.gzipped.length) +
      (stats.isJS || stats.isCSS ?
        ' min: ' + getHumanSize(stats.uglified.length) +
        ' gzip+Min: ' + getHumanSize(stats.both.length) : ''
      )
    );

  if (ret) {
    return msg;
  }
  console.log(msg);
};
