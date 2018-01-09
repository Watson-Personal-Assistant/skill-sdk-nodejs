/*
© Copyright IBM Corp. 2017
*/


'use strict';

const Handler = require('./handler');
const Nlu = require('./nlu/nlu');
const Intentity = require('./nlu/intentity');

module.exports = {
    handler: new Handler(),
    engineBase: Nlu,
    intentity: Intentity
};
