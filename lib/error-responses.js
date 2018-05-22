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

function invalidAction(name) {
    return `Could not find or run action ${name}, please check it in the actions.js file`;
}

function noEvaluationAction() {
    return 'There is no evaluation intent in the actions.js file (in the skill), add it and try again';
}

function noNluDeclared() {
    return `Could not evaluate request, no NLU engines declared in the manifest`;
}

// Return response errors
module.exports = {

    invalidNluType: invalidNluType,
    couldNotReadNluType: couldNotReadNluType,
    invalidAction: invalidAction,
    noEvaluationAction: noEvaluationAction,
    noNluDeclared: noNluDeclared
};
