var BuildCommand = require('ember-cli/lib/commands/build');

var Command = BuildCommand.extend({
  name: 'asset-sizes',
  description: 'Builds a production version of your app and places it into the output path (dist/ by default) while logging asset sizes.',
  aliases: ['a'],

  availableOptions: [
    { name: 'suppress-sizes', type: Boolean, default: true },
    { name: 'environment', type: String,  default: 'production', aliases: ['e', { 'dev': 'development' }, { 'prod': 'production' }] },
    { name: 'sizes', type: Boolean, default: true, aliases: ['s'] },
    { name: 'trace', type: String, aliases: ['t'] },
    { name: 'trace-all', type: Boolean, default: false, aliases: ['ta'] },
    { name: 'output-path', type: 'Path', default: 'dist/', aliases: ['o'] }
  ]

});

Command.overrideCore = true;

module.exports = Command;
