/*
 © Copyright IBM Corp. 2017
 */

'use strict';
const path = require('path');

process.env.skillSDKResDir = path.dirname(process.argv[1]) + "/res";

const {handler} = require('./lib');
const {server} = require('./lib/server');
const {logger} = require('./lib/logger.js');

// Server is exported for testing purposes
module.exports = {
    handler: handler,
    server: server,
    logger: logger
};
