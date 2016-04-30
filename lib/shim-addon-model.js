var mergeTrees = require('broccoli-merge-trees');
var p = require('ember-cli-preprocess-registry/preprocessors');
var preprocessCss = p.preprocessCss;

module.exports = function shim(model, assetCache) {

  /*
    These aren't exactly the babelOptions we were looking for...

    ... but they are close enough for the Imperial Storm Troopers.
   */


  model.prototype.__babelOptions = function fakeGetBabelOptions() {
    var babelOptions = { babel: {} };

    if (this._addonInstalled('ember-cli-babel')) {
      var amdNameResolver = require('amd-name-resolver').moduleResolve;
      babelOptions = {
        babel: {
          compileModules: true,
          modules: 'amdStrict',
          moduleIds: true,
          resolveModuleSource: amdNameResolver
        }
      };
    }

    delete babelOptions.babel.compileModules;
    delete babelOptions.babel.includePolyfill;
    return babelOptions;
  };

  model.prototype._addonInstalled = function(addonName) {
    return !!this.registry.availablePlugins[addonName];
  };





  model.prototype.compileAddon = function compileAddon(tree) {
    this._requireBuildPackages();

    var addonJs = this.processedAddonJsFiles(tree);
    var templatesTree = this.compileTemplates(tree);
    var options = this.__babelOptions();

    if (assetCache.isActive) {
      var addonCache = assetCache.lookup(this.name);

      templatesTree = addonCache.observe(templatesTree, 'addon-templates', options);
      addonJs = addonCache.observe(addonJs, 'addon-js', options);
    }

    var trees = [addonJs, templatesTree].filter(Boolean);

    return mergeTrees(trees, {
      annotation: 'Addon#compileAddon(' + this.name + ') '
    });
  };

  model.prototype.compileStyles = function compileStyles(tree) {
    this._requireBuildPackages();

    if (tree) {
      var output = preprocessCss(tree, '/', '/', {
        outputPaths: { 'addon': this.name + '.css' },
        registry: this.registry
      });
      return assetCache.lookup(this.name).observe(output, 'addon-css', {});
    }
  };

};
