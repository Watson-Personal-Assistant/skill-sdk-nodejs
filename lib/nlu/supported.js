/*
© Copyright IBM Corp. 2017
*/


'use strict';

const fs = require('fs');
const path = require('path');
const logger = require('../logger');

// Path to NLU engines
const PATHBuiltInt = __dirname + '/bundles/engines';
const PATHUser = 'res/nlu/engines';

// Get all supported NLU types. Currently we assume that if folder exists in
// the PATH, the engine is valid and can be used.
const supportedBuiltIn = fs.readdirSync(PATHBuiltInt).filter(f => fs.statSync(path.join(PATHBuiltInt, f)).isDirectory());
let supportedUser;
if(fs.existsSync(PATHUser)) {
    supportedUser = fs.readdirSync(PATHUser).filter(f => fs.statSync(path.join(PATHUser, f)).isDirectory());
}
else {
    supportedUser = [];
}
logger.info(`Supported nlu types: ${supportedBuiltIn.concat(supportedUser)}`);

module.exports = {

    getSupportedBuiltIn: function () {
        return supportedBuiltIn;
    },
    getSupportedUser: function () {
        return supportedUser;
    }
};
