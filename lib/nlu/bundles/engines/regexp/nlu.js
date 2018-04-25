/*
 © Copyright IBM Corp. 2017
 */


/* jshint loopfunc: true */

'use strict';

const Pattern = require('./pattern');
const Base = require('../../../nlu');
const Intentity = require('../../../intentity');
const logger = require('../../../../logger');
const instrument = require('../../../../instrument');

class Nlu extends Base {

    constructor(name) {
        super(name);
        this.patterns = [];
    }

    init(resource, force) {
        var self = this;
        return new Promise((resolve, reject) => {
            load(self, resource, true, (err, result) => {
                resolve(self);
            });
        });
    }

    evaluate(request, cb) {
        instrument.entryTime(request, "regexp", "evaluate");
        var intentity = new Intentity('regexp');
        // Start time measuring
        var hrstart = process.hrtime();
        // Trim and remove duplicate spaces
        let text = request.retext.trim().replace(/\s\s+/g, ' ');
        // Find the best match. If we have max confidence, no need to search
        // any more.
        var confidence = 0;
        for (var i = 0; i < this.patterns.length && (confidence < 1.0); i++) {
            // Match the text to the pattern and keep only the best match
            var pattern = this.patterns[i];
            var match = pattern.match(text);
            if (match && (match.confidence > confidence)) {
                // Clear previous data, we have new candidate.
                intentity.clear();
                // Add the intent
                intentity.addIntents(pattern.name, match.confidence);
                // Add the entities. We trim the value as in wildcard values we might get spaces
                // in the end or begining of the value.
                pattern.variables.forEach(variable => {
                    intentity.addEntity(variable, match[variable].trim(), match.confidence);
                });
                // New top confidence
                confidence = match.confidence;
                //logger.debug(this.patterns[i]);
            }
        }
        // End time measuring
        var hrend = process.hrtime(hrstart);
        var time = 1000 * hrend[0] + hrend[1] / 1000000;
        logger.info('Nlu [regexp]:' +
            ' confidence ' + intentity.getMaxIntentConfidence().toFixed(3) +
            ' ' + this.name + ' [' + intentity.getIntentName() + ', ' + intentity.getNumOfEntities() +
            '] ' + time.toFixed(3) + 'ms');
        // No match
        instrument.exitTime(request, "regexp", "evaluate");
        cb(null, intentity);
    }

}

function load(self, resource, force, cb) {
    // Load the regular expression resource
    resource.intents.forEach(intent => {
        if (intent.visibility !== 'gone') {
            intent.grammar.forEach(item => {
                let pattern = new Pattern(intent, item, resource);
                self.patterns.push(pattern);
            });
        }
    });
    //logger.debug(self.patterns);
    cb();
}

module.exports = Nlu;
