/*
 © Copyright IBM Corp. 2017
 */


'use strict';
const path = require('path');

const nluFolder = '/nlu/';
const intentsFileName = 'intents.json';

module.exports = {
    get: get
};

function get(req, res) {
    let file = path.join(process.env.skillSDKResDir, nluFolder, intentsFileName);

    try {
        // Force reload
        delete require.cache[require.resolve(file)];
        res.json(require(file));
    } catch (err) {
        res.status(404).send();
    }
}
