/*
© Copyright IBM Corp. 2017
*/


'use strict';

const {handler} = require('../../..');

module.exports = {
  post: post
};

function post(req, res) {
  const request = req.swagger.params.input.value;
  handler.handleRequest(request, false, (err, result) => {
    res.json(result);
  });
}
