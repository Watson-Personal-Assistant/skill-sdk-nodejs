/*
© Copyright IBM Corp. 2017
*/


'use strict';

function invalidNluType(engineName) {
    return `${engineName} Nlu engine is not supported, ma`
}

function couldNotReadNluType(type) {
    return `Could not read Nlu type ${type} please make sure you have a file named ${type}.json under /res/nlu`
}

// Return response errors
module.exports = {

    invalidNluType: invalidNluType,
    couldNotReadNluType: couldNotReadNluType,
};
