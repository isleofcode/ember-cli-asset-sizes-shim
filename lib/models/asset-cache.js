var LibQuantifier = require('./lib-quantifier');

function AssetCache(options) {
  this._cache = {};
  this._options = options || {};

  this.isActive = this._options.logAssets || this._options.addonToTrace;
}

AssetCache.prototype.lookup = function lookup(name) {
  var cached = this._cache[name];

  if (!cached) {
    this._cache[name] = cached = new LibQuantifier(name, this._options);
  }

  return cached;
};

AssetCache.prototype.forEach = function(callback) {
  var cache = this._cache;

  Object.keys(cache).forEach(function(item, index) {
    callback(cache[item], index);
  });
};

module.exports = AssetCache;
