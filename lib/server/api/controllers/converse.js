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
    instrument.entryTime(request, "handleRequest");
    handler.handleRequest(request, (err, result) => {
        instrument.exitTime(result, "handleRequest");
        res.json(result);
    });
}
