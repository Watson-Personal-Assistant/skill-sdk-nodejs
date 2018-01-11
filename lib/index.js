/*
© Copyright IBM Corp. 2017
*/


'use strict';

const Handler = require('./handler');
const factory = require('./nlu/factory');
module.exports = {
    handler: new Handler(),
    factory: factory
};
