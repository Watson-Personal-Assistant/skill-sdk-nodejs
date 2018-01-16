/*
© Copyright IBM Corp. 2017
*/


'use strict';

// Initialize handler
const {handler} = require('./');
const {logger} = require('./');
const manifest = require('./res/assets/manifest.json');
if(manifest.nlu.indexOf('wcs') > -1) {
    handler.initialize();
}

logger.info("Logger Works");
// The expertise handler
require('./actions')();
