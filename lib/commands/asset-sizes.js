var BuildCommand = require('ember-cli/lib/commands/build');

var Command = BuildCommand.extend({
  name: 'asset-sizes',
  description: 'Builds a production version of your app and places it into the output path (dist/ by default) while logging asset sizes.',
  aliases: ['a'],

  availableOptions: [
    { name: 'sizes', type: Boolean, default: true, aliases: ['s'] },
    { name: 'environment', type: String,  default: 'production', aliases: ['e', { 'dev': 'development' }, { 'prod': 'production' }] },
    { name: 'trace', type: String, aliases: ['t'] },
    { name: 'trace-all', type: Boolean, default: false, aliases: ['ta'] },
    { name: 'output-path', type: 'Path', default: 'dist/', aliases: ['o'] },

    // these are on the build command, but don't really serve us well here
    { name: 'suppress-sizes', type: Boolean, default: true },
    { name: 'watch', type: Boolean, default: false, aliases: ['w'] },
    { name: 'watcher', type: String }
  ],

  run: function(commandOptions) {
    if (!this.tasks.ShowAssetSizes) {
      this.tasks.ShowAssetSizes = function() { this.run = function() { return true; }};
    }

    return this._super.run.call(this, commandOptions);

  }

});

Command.overrideCore = true;

module.exports = Command;
