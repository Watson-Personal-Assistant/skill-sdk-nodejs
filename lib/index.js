/*
© Copyright IBM Corp. 2017
*/


'use strict';

const Handler = require('./handler');
const Nlu = require('./nlu/nlu');

module.exports = {
    handler: new Handler(),
    engineBase: Nlu
};
