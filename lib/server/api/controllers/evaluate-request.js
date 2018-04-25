/*
 © Copyright IBM Corp. 2017
 */


'use strict';

const {handler} = require('../../..');
const instrument = require('../../../instrument.js');

module.exports = {
    post: post
};

function post(req, res) {
    const request = req.swagger.params.input.value;
    request.skillKey = req.skillKey;
    if (!request.retext) {
        request.retext = request.text;
    }

    instrument.entryTime(request, "evaluateRequest");
    handler.handleEvaluationRequest(request, (err, result) => {
        instrument.exitTime(result, "evaluateRequest");
        if (err) {
            if(err.responseCode) {
                res.statusCode = err.responseCode;
                res.json(err.requestResult);
            } else {
                res.json(err);
            }
        } else {
            res.json(result);
        }
    });
}