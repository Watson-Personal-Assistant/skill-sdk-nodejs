/*
© Copyright IBM Corp. 2017
*/


'use strict';

class Nlu {

  constructor(name) {
    this.name = name;
  }

  /**
   * initialization function - will be called once (in the index.js file) when loading the skill
   * @param resource - this is the nlu resource configuration file (you get it by calling manifest.nlu['nlu type'])
   * @param force
   */
  init(resource, force) {
  }

  /**
   * evaluation function - is used to evaluate a request, this function will be called automatically by the skill
   * handler during the request evaluation
   * @param request - the request sent to the skill (usually by WA)
   * @param cb - is expected to be called with the following parameters:
   *             1. err
   *             2. an intentity object
   *             3. output/response - this is optional, this could save a call to the nlu in the actions.js file
   */
  evaluate(request, cb) {
  }
}

module.exports = Nlu;
