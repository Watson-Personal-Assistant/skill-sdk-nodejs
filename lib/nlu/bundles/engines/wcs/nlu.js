/*
 © Copyright IBM Corp. 2017
 */


'use strict';

const Workspace = require('./workspace');
const Base = require('../../../nlu');
const Intentity = require('../../../intentity');
const logger = require('../../../../logger');
const instrument = require('../../../../instrument');

class Nlu extends Base {

    constructor(name) {
        super(name);
        this.workspace = {};
    }

    init(resource, force) {
        return new Promise((resolve, reject) => {
            load(this, resource, force, (err, result) => {
                if (err) {
                    logger.error(err);
                    reject();
                } else {
                    resolve(this);
                }
            });
        });
    }

    evaluate(request, cb) {
        instrument.entryTime(request, "WCS", "evaluate");
        var intentity = new Intentity('wcs');
        const language = request.language;
        // Do we have NLU for the required language?
        if (this.workspace[language]) {
            // Start time measuring
            const hrstart = process.hrtime();
            if (!request.skillContext) {
                request.skillContext = {};
            }

            this.workspace[language].process(request.retext, request.skillContext, (err, result) => {
                if (err) {
                    logger.error('Nlu [wcs]:' + this.name + ':' + err);
                    cb(null, intentity, undefined);
                } else {
                    // End time measuring
                    const hrend = process.hrtime(hrstart);
                    const time = 1000 * hrend[0] + hrend[1] / 1000000;
                    if (result && result.intents && result.intents.length > 0) {
                        result.intents.forEach(intent => {
                            // Add the intent and the entities
                            if (intent.intent !== 'null') {
                                // The intent
                                intentity.addIntent(intent.intent, intent.confidence);
                            }
                            logger.info('Nlu [wcs]:' +
                                ' confidence ' + intent.confidence.toFixed(6) +
                                ' ' + this.name + ' [' + intent.intent + ', ' + intentity.getNumOfEntities() +
                                '] ' + time.toFixed(3) + 'ms');
                        });

                    }
                    if (result && result.entities && result.entities.length > 0) {
                        // The entities
                        result.entities.forEach(function (entity) {
                            intentity.addEntity(entity.entity, entity.value, entity.confidence);
                        });
                    }

                    let output = {text: result.output.text, context: result.context};
                    instrument.exitTime(request, "WCS", "evaluate");
                    cb(null, intentity, output);
                }
            });
        } else {
            cb(null, intentity, undefined);
        }
    }
}

function load(self, resource, force, cb) {
    // Bind to existing workspace or create new one with specified content
    Object.keys(resource.workspace).forEach(language => {
        if (resource.workspace[language].workspace_id) {
            const workspaceID = resource.workspace[language].workspace_id;
            self.workspace[language] = new Workspace(resource.credentials);
            self.workspace[language].bind(workspaceID, (err, result) => {
                if (err) {
                    logger.error(`Failed to load wcs ${language} workspace ${workspaceID}`);
                } else {
                    logger.info(`Load wcs ${language} workspace ${workspaceID}`);
                }
                cb(err, result);
            });
        } else if (resource.workspace[language].content) {
            const content = resource.workspace[language].content;
            self.workspace[language] = new Workspace(resource.credentials);
            self.workspace[language].create(content, (err, result) => {
                if (err) {
                    logger.error(`Failed to create wcs ${language} workspace ${content.name}`);
                } else {
                    logger.info(`Create wcs ${language} workspace ${content.name}`);
                }
                cb(err, result);
            });
        }
    });
}

module.exports = Nlu;
