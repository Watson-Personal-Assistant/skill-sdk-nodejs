/*
© Copyright IBM Corp. 2017
*/


'use strict';

// Initialize handler
const {handler} = require('./');
const manifest = require('./manifest.json');
if(manifest.nlu.indexOf('wcs') > -1) {
    handler.initialize();
}

// The expertise handler
require('./actions')();
