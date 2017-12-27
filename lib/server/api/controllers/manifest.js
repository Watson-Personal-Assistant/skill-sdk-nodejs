/*
© Copyright IBM Corp. 2017
*/


'use strict';

const logger = require('../../../logger');
const path = require('path');
const manifestFileName = 'manifest.json';

module.exports = {
  get: get
};

function get(req, res) {
  var manifest = {};
  try {
    manifest = require(path.join(process.env.skillSDKRootDir, manifestFileName));
    res.json(manifest);
  } catch (err) {
    logger.error('failed to load manifest');
    res.status('404').json();
  }
}
