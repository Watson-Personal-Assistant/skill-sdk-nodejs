/*
 © Copyright IBM Corp. 2017
 */

'use strict';
const path = require('path');
process.env.skillSDKResDir = process.cwd() + "/res";

const {handler} = require('./lib');
const {server} = require('./lib/server');
const factory = require('./lib/nlu/factory');
const intentity = require('./lib/nlu/intentity');
const nlu = require('./lib/nlu/nlu');
const logger = require('./lib/logger.js');

// Server is exported for testing purposes
module.exports = {
    handler: handler,
    server: server,
    factory: factory,
    intentity: intentity,
    nlu: nlu,
    logger: logger

};
