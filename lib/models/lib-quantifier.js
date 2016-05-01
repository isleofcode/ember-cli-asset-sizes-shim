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
var debug = require('debug')('asset-sizes:quantifier');
// var debugStyles = require('debug')('asset-sizes:styles');
// var Funnel = require('broccoli-funnel');

var TranspiledTypes = ['addon-js', 'addon-templates', 'templates', 'app'];
var BannedTypes = ['addon', 'test-support', 'addon-test-support'];

function shouldAnalyzeTree(tree, type) {
  return tree && (BannedTypes.indexOf(type) === -1);
}

function getHumanSize(size) {
  return padRight(filesize(size), 10, ' ');
}

function reduceAssetType(Type, type) {
  return Type.reduce(function(chain, info) {
    chain.original += info.sizes.original;
    chain.final += info.sizes.final;

    return chain;
  }, { original: 0, final: 0, type: type });
}

function LibQuantifier(name, options) {
  this.name = name;
  this.options = options;
  this._cache = {};
}

LibQuantifier.prototype.analyze = function analyze(finalVendor) {
  debug('analyze ' + this.name);
  var addonName = this.name;
  var cache = this._cache;
  var options = this.options;
  var infos = [];

  // vendor / imported code (app.import)
  if (cache.imports) {
    var imports = [];

    cache.imports.forEach(function(item) {
      var fullPath = path.join(finalVendor.destPath, item.path);

      debug(chalk.white('looking up `' + item.asset + '` at ' + chalk.grey(fullPath)));
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
      return value + type.final;
    }, 0),
    types: infos,
    vendor: cache.vendor,
    shouldLog: options.traceAll || options.addonToTrace === addonName
  };

};

LibQuantifier.prototype.log = function log() {
  debug('log ' + this.name);
  var info = this.stats;
  var totalSize = info.size;

  function sortLargestToSmallest(a, b) {
    if (a.final > b.final) {
      return -1;
    }
    if (a.final < b.final) {
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

      var smallest = typeInfo.final;

      console.log(
        '    ' +  chalk[colorForSize(smallest)](getHumanSize(smallest)) +
        chalk.cyan(padRight(typeInfo.type, 12, ' ')) + chalk.grey(
          'original: ' + getHumanSize(typeInfo.original) +
          ' gzip+min: ' + getHumanSize(smallest)
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
    debug('generated cache for ' + type);
    this._cache[type] = cached = [];
  }

  return cached;
};

LibQuantifier.prototype.observe = function observeTree(tree, type, options) {
  if (!shouldAnalyzeTree(tree, type)) {
    debug('Skipping observation for ' + this.name + ':' + type);
    return tree;
  }
/*
  if (type === 'styles') {
    debugStyles('Skipping observation of tree for ' + this.name + ':styles');
    console.log(tree);
    return tree;
  }
*/

  debug('Observing ' + this.name + ':' + type);
  var cache = this.lookup(type);
  var transpiled = tree;

  if (options.babel && TranspiledTypes.indexOf(type) !== -1) {
    debug(chalk.yellow('Will Transpile Tree'));
    transpiled = new Babel(mergeTrees([tree]), options.babel);
  }

  return new TreeLogger(transpiled, { name: type, cache: cache, annotation: 'stats for ' + this.name + ':' + type });
/*
  if (type === 'styles') {
    return new Funnel(logged, {
      destDir: 'app/styles'
    });
  }

  return logged;
*/
};

module.exports = LibQuantifier;
