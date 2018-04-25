/*
© Copyright IBM Corp. 2017
*/

const packageJSON = require('../../../../package');

'use strict';

module.exports = {
  get: get
};

function get(req, res) {
    const response = {
      skill_sdk_version: packageJSON.version
    };
  res.json(response);
}
