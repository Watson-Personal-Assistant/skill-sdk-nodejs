/*
© Copyright IBM Corp. 2017
*/


'use strict';

const logger = require('../../../logger');
const path = require('path');
const assetsFolder = '/assets/';
const manifestFileName = 'manifest.json';

module.exports = {
  get: get
};

function get(req, res) {
  var manifest = {};
  try {
    manifest = require(path.join(process.env.skillSDKResDir, assetsFolder, manifestFileName));
    res.json(manifest);
  } catch (err) {
    logger.error('Failed to load manifest');
    res.status('404').json();
  }
}
