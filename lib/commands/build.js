var BuildCommand = require('ember-cli/lib/commands/build');

var Command = BuildCommand.extend({
  availableOptions: [
    { name: 'environment',    type: String,  default: 'development', aliases: ['e', { 'dev': 'development' }, { 'prod': 'production' }] },
    { name: 'output-path',    type: 'Path',  default: 'dist/',       aliases: ['o'] },
    { name: 'watch',          type: Boolean, default: false,         aliases: ['w'] },
    { name: 'watcher',        type: String },
    { name: 'suppress-sizes', type: Boolean, default: false },
    { name: 'asset-sizes', type: Boolean, default: false, aliases: ['a'] },
    { name: 'trace-asset', type: String, aliases: ['t'] }
  ],

  run: function(commandOptions) {
    process._flags = commandOptions;
    return this._super.run.call(this, commandOptions);
  }

});

Command.overrideCore = true;

module.exports = Command;
