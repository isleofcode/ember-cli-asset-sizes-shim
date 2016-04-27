/* jshint node: true */
'use strict';
var analyzePath = require('./helpers/analyze-path');

function loopFiles(files) {
  for (var outputFileName in files) {
    console.log('\t Included Assets for: ' + outputFileName);
    for (var i = 0; i < files[outputFileName].length; i++) {
      // do stuff to log the size
      analyzePath(files[outputFileName][i]);
    }
  }
}

module.exports = {
  name: 'ember-cli-asset-sizes-shim',

  postBuild: function(output) {

    loopFiles(this.app._scriptOutputFiles);
    loopFiles(this.app._styleOutputFiles);

  }

};
