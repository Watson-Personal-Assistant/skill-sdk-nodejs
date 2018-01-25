/*
 © Copyright IBM Corp. 2017
 */

'use strict';
const path = require('path');

process.env.skillSDKResDir = path.dirname(process.argv[1]) + "/res";

const {handler} = require('./lib');
const {server} = require('./lib/server');
const factory = require('./lib/nlu/factory');
const intentity = require('./lib/nlu/intentity');
const nlu = require('./lib/nlu/nlu');

function init(manifest) {
    factory.getNLUs(manifest).then(updatedManifest => {
        if (updatedManifest.nlu.regexp) {
            updatedManifest.intents = require('../../res/nlu/intents');
        }
        handler.manifest = updatedManifest;
        factory.createAll(updatedManifest).then(function (engines) {
            handler.engines = engines;
        });
    });
}

// Server is exported for testing purposes
module.exports = {
    handler: handler,
    server: server,
    init: init,
    intentity: intentity,
    nlu: nlu
};
