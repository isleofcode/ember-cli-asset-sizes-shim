var TreeLogger = require('../plugins/tree-logger');
var mergeTrees = require('broccoli-merge-trees');
var Babel  = require('broccoli-babel-transpiler');
var analyzePath = require('../helpers/analyze-path');
var path = require('path');
var filesize = require('filesize');
var logFile = require('../helpers/log-file-stats');
var chalk = require('chalk');
var colorForSize = require('../utils/color-for-size');
var padRight = require('../utils/pad-right');
var debug = require('debug')('asset-sizes');

var TranspiledTypes = ['addon-js', 'addon-templates', 'templates', 'app'];

function shouldAnalyzeTree(tree, type) {
  return tree && (type !== 'addon' && type !== 'test-support' && type !== 'addon-test-support');
}

function getHumanSize(size) {
  return padRight(filesize(size), 10, ' ');
}

function reduceAssetType(Type, label) {
  var sizes = Type.reduce(function(chain, info) {
    chain.total += info.stats.size;
    chain.gzipped += info.gzipped.length;
    chain.uglified += (info.uglified.length || info.stats.size);
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

function LibQuantifier(name, options) {
  this.name = name;
  this.options = options;
  this._cache = {};
}

LibQuantifier.prototype.analyze = function analyze(finalVendor) {
  var addonName = this.name;
  var cache = this._cache;
  var options = this.options;
  var infos = [];

  // vendor / imported code (app.import)
  if (cache.imports) {
    var imports = [];

    cache.imports.forEach(function(item) {
      var fullPath = path.join(finalVendor.destPath, item.path);

      debug(chalk.white('\t[' + addonName + '] Looking up `' + item.asset + '` at ' + chalk.grey(fullPath)));
      analyzePath(options.root, fullPath, function(info) {
        imports.push(info);
      });
    });

    delete cache.imports;
    cache.vendor = imports;
  }

  Object.keys(cache).forEach(function(type) {
    if (cache[type]) {
      if (type === 'addon-test-support' || type === 'test-support') {
        return;
      }
      infos.push(reduceAssetType(cache[type], type));
    }
  });

  this.stats = {
    name: addonName,
    size: infos.reduce(function(value, type) {
      return value + type.both;
    }, 0),
    types: infos,
    vendor: cache.vendor,
    shouldLog: options.traceAll || options.addonToTrace === addonName
  };

};

LibQuantifier.prototype.log = function log() {
  var info = this.stats;
  var totalSize = info.size;

  function sortLargestToSmallest(a, b) {
    if (a.total > b.total) {
      return -1;
    }
    if (a.total < b.total) {
      return 1;
    }
    // a must be equal to b
    return 0;
  }

  // sort types largest to smallest
  info.types.sort(sortLargestToSmallest);

  // sort vendor imports largest to smallest
  if (info.shouldLog && info.vendor) {
    info.vendor.sort(sortLargestToSmallest);
  }

  console.log(
    '  ' + chalk[colorForSize(totalSize)](getHumanSize(totalSize)) +
    chalk.cyan(info.name)
  );

  if (info.shouldLog) {
    info.types.forEach(function(typeInfo) {
      if (typeInfo.type === 'addon-test-support' || typeInfo.type === 'test-support') {
        return;
      }

      var smallest = typeInfo.hasJS || typeInfo.hasCSS ? typeInfo.both : typeInfo.gzipped;

      console.log(
        '    ' +  chalk[colorForSize(smallest)](getHumanSize(smallest)) +
        chalk.cyan(padRight(typeInfo.type, 12, ' ')) + chalk.grey(
          'Original: ' + getHumanSize(typeInfo.total) +
          ' gzip: ' + getHumanSize(typeInfo.gzipped) +
          (typeInfo.hasJS || typeInfo.hasCSS ?
            ' min: ' + getHumanSize(typeInfo.uglified) +
            ' gzip+Min: ' + getHumanSize(typeInfo.both) : ''
          )
        )
      );

      if (typeInfo.type === 'vendor') {
        info.vendor.forEach(function(fileInfo) {
          logFile(fileInfo, false, '      ');
        });
      }

    });
  }


};

LibQuantifier.prototype.lookup = function lookup(type) {
  var cached = this._cache[type];

  if (!cached) {
    this._cache[type] = cached = [];
  }

  return cached;
};

LibQuantifier.prototype.observe = function observeTree(tree, type, options) {
  if (!shouldAnalyzeTree(tree, type)) {
    return tree;
  }

  var cache = this.lookup(type);
  var transpiled = tree;

  if (options.babel && TranspiledTypes.indexOf(type) !== -1) {
    transpiled = new Babel(mergeTrees([tree]), options.babel);
  }

  return new TreeLogger([transpiled], { name: type, cache: cache });
};

module.exports = LibQuantifier;
