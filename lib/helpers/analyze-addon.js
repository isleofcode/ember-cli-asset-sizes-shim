var chalk = require('chalk');
var analyze = require('./analyze-path');
var logFile = require('./log-file-stats');
var path = require('path');
var filesize = require('filesize');

function padRight(str, l, p) {
  var s = str;
  while (s.length < l) {
    s += p;
  }
  return s;
}

function getHumanSize(size) {
  return padRight(filesize(size), 10, ' ');
}

function colorizeSize(size) {
  var smallColor = 'grey';
  if (size > 1024) {
    smallColor = 'white';
  }
  if (size > 1024 * 5) {
    smallColor = 'green';
  }
  if (size > (1024 * 10)) {
    smallColor = 'yellow';
  }
  if (size > (1024 * 50)) {
    smallColor = 'magenta';
  }
  if (size > (1024 * 500)) {
    smallColor = 'red';
  }

  return smallColor;
}

function logAddon(info) {
  var totalSize = info.types.reduce(function(value, type) {
    return value + type.both;
  }, 0);

  console.log(
    '  ' + chalk[colorizeSize(totalSize)](getHumanSize(totalSize)) +
      chalk.cyan(info.name)
  );

  if (info.shouldLog) {
    info.types.forEach(function(typeInfo) {
      if (typeInfo.type === 'addon-test-support' || typeInfo.type === 'test-support') {
        return;
      }

      console.log(
        '    ' +  chalk[colorizeSize(totalSize)](getHumanSize(totalSize)) +
        chalk.cyan(padRight(typeInfo.type, 12, ' ')) + chalk.grey(
          'Original: ' + getHumanSize(typeInfo.total) +
          ' gzip: ' + getHumanSize(typeInfo.gzipped) +
          (typeInfo.hasJS || typeInfo.hasCSS ?
            ' min: ' + getHumanSize(typeInfo.uglified) +
            ' gzip+Min: ' + getHumanSize(typeInfo.both) : ''
          )
        )
      );
    });
    info.vendor.forEach(function(fileInfo) {
      logFile(fileInfo, false, '      ');
    });
  }

}

function reduceAssetType(Type, label) {
  var sizes = Type.reduce(function(chain, info) {
    chain.total += info.stats.size;
    chain.gzipped += info.gzipped.length;
    chain.uglified += info.uglified.length;
    chain.both += (info.both.length || info.gzipped.length);
    chain.isJS = chain.isJS || info.isJS;
    chain.isCSS = chain.isCSS || info.isCSS;

    return chain;
  }, {total: 0, gzipped: 0, uglified: 0, both: 0, isJS: false, isCSS: false });

  return {
    hasJS: sizes.isJS,
    hasCSS: sizes.isCSS,
    type: label,
    total: sizes.total,
    gzipped: sizes.gzipped,
    uglified: sizes.uglified,
    both: sizes.both
  };
}

module.exports = function(addonName, AddonModules, options) {
  var infos = [];

  // vendor / imported code (app.import)
  if (AddonModules.imports) {
    var imports = [];

    AddonModules.imports.forEach(function (item) {
      analyze(options.root, path.join(options.root, item.path), function(info) {
        imports.push(info);
      });
    });

    delete AddonModules.imports;
    AddonModules.vendor = imports;
  }

  Object.keys(AddonModules).forEach(function(type) {
    if (AddonModules[type]) {
      if (type === 'addon-test-support' || type === 'test-support') {
        return;
      }
      infos.push(reduceAssetType(AddonModules[type], type));
    }
  });

  var addonInfo = {
    name: addonName,
    types: infos,
    vendor: AddonModules.vendor,
    shouldLog: options.shouldLog
  };

  logAddon(addonInfo);
};
