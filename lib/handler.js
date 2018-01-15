/*
© Copyright IBM Corp. 2017
*/


'use strict';

const i18 = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');
const Response = require('./response');
const EvaluationResponse = require('./evaluation-response');
const logger = require('./logger');
const Conversation = require('watson-developer-cloud/conversation/v1');
const Promise = require('bluebird');
const fs = require('fs');
const path = require('path');
const async = require('async');
const errors = require('./error-responses');


const nluFolder = '/nlu';
const wcsFileName = '/wcs.json';

let Handler = function () {
    this.states = {};
};

/**
 * Initializes the handler, sets up the connection to wcs
 */
Handler.prototype.initialize = function () {
    let rawJson = fs.readFileSync(path.join(process.env.skillSDKResDir, nluFolder, wcsFileName));
    this.wcsCredentials = JSON.parse(rawJson);
    if (this.wcsCredentials) {
        let credentials = this.wcsCredentials.credentials;
        setupWcs(this, credentials.url, credentials.username, credentials.password, credentials.version_date)
    }
};

/**
 * Handles the evaluation request, creates an evaluationRequest object and calls the evaluation action
 * @param request - the request json
 * @param callback - a callback function that gets the evaluation response
 */
Handler.prototype.handleEvaluationRequest = function (request, callback) {
    let evaluationResponse = new EvaluationResponse((err, result) => {
        this.saveContext(request, context, evaluationResponse);
        callback(err, evaluationResponse.response);
    });
    let context = createContext(request);
    let state = this.state || 'DEFAULT';
    do {
        const action = this.states[state].actions['evaluation'] || undefined;
        // Run action for pre-processing before the evaluation
        if (!action) {
            logger.error(errors.noEvaluationAction());
            callback(errors.noEvaluationAction());
        }
        action(request, evaluationResponse, context);
        this.state = evaluationResponse.state || this.state;
        // Next state or stop (we have the response)
        state = evaluationResponse.state;
        // Clear, will be set by next action call.
        delete evaluationResponse.state;
    } while(state !== undefined)
};


/**
 * Evaluates the request, usually it is called by the developer from the 'evaluation' action,
 * it calls the Nlu engine and picks the most fitting intent
 * @param request
 * @param evaluationResponse
 * @param context
 * @param callback
 */
Handler.prototype.evaluateRequest = function (request, evaluationResponse, context, callback) {
    request.skillContext = context.skill;
    getIntentity(this, request, (err, intentResult, output) => {
        if (err) {
            callback(evaluationResponse, context, err);
        }
        else {
            let bin = [];
            for (let intentity of intentResult) {
                bin.push(intentity);
            }
            evaluationResponse.response.intentConfidence = intentResult;
            let textResponse;
            if(output) {
                context.skill = output.context ? output.context : {};
                textResponse = output.text ? output.text : undefined;
            }
            callback(textResponse, evaluationResponse, context, undefined);

        }
    });
};

Handler.prototype.handleRequest = function (request, isEvaluationRequest = false, callback) {
    logger.info('Request', {request});
    // State and session context for short access
    let context = createContext(request);
    this.state = request.context.session.attributes.state;
    // Update language
    i18.changeLanguage(request.language);
    let response;
    // callback function to be used by the response objects
    let responseCallback = function (err, result) {
        this.saveContext(request, context, response);
        // Log the response
        logger.info('Response', response.response);
        // Return the response
        callback(err, response.response);
    };
    response = new Response(responseCallback);
    // Handle intent
    try {
        handleAction(this, request, response, context);
    } catch (err) {
        callback(errors.invalidAction(request.attributes.intent));
    }
};


Handler.prototype.createActionsHandler = function (actions, state = 'DEFAULT') {
    return {
        actions: actions,
        state: state
    };
};

Handler.prototype.registerActionsHandler = function (...handlers) {
    for (let handler of handlers) {
        if (this.states[handler.state] === undefined) {
            logger.debug(`Add actions for state ${handler.state}`);
            this.states[handler.state] = {
                actions: handler.actions
            };
        } else {
            logger.error(`Actions state ${handler.state} already exist`);
        }
    }
};

Handler.prototype.registerLanguages = function (languages) {
    this.languages = languages;
    if (this.languages) {
        i18.use(sprintf).init({
            lng: 'en-US',
            overloadTranslationOptionHandler: sprintf.overloadTranslationOptionHandler,
            resources: languages
        }, (err, t) => {
            if (err) {
                logger.error(`Failed to register languages: ${err}`);
            }
        });
    }
};

/**
 * use this function to send a message to wcs
 *
 * @param request - the request to be sent to wcs
 * @param response - the response variable
 * @param callback - callback function to handle the result from wcs
 */
Handler.prototype.converse = function (request, response, context, callback) {
    callConversation(this, request, context.skill).then(result => {
        // Save the context of the watson conversation service
        context.skill = result.context;
        callback(result, response, context, undefined);
    }).catch(err => {
        callback(undefined, response, context, err);
    });
};

/**
 * Saves context to a response object
 * @param self
 * @param request
 * @param context
 * @param response
 */
Handler.prototype.saveContext = function (request, context, response) {
    let sessionContext = {
        skill: {
            attributes: context.skill
        },
        attributes: context.session
    };
    // Returned context
    Object.assign(response.response, {
        context: {
            application: request.context.application,
            session: sessionContext
        }
    });
};

Handler.prototype.t = function (text) {
    if (this.languages) {
        if (Array.isArray(text)) {
            let results = [];
            for (let t of text) {
                results.push(this.t(t));
            }
            return results;
        } else {
            return i18.t.apply(i18, arguments);
        }
    }
    return text;
};


module.exports = Handler;


/**
 * Gets a request and goes over all the Nlu engines and returns intentity objects for each one.
 * @param self
 * @param request
 * @param cb
 */
let getIntentity = function (self, request, cb) {

    // Build the order
    var tasks = [];
    let textOutput;
    self.engines.forEach(nlu => {
        tasks.push(callback => {
            nlu.evaluate(request, (err, result, output) => {
                textOutput = output;
                callback(null, result);
            });
        });
    });
    // Extract intent / entities and filter
    async.parallel(tasks, (err, results) => {
        cb(null, results, textOutput);
    });
};

/**
 * sets up your WCS credentials, these will be used to access your
 * WCS service
 *
 * @param wcsUrl - your wcs url, for US: https://gateway.watsonplatform.net/conversation/api
 *                               for Germany: https://gateway-fra.watsonplatform.net/conversation/api
 * @param wcsUsername - your wcs username
 * @param wcsPassword - your wcs password
 * @param versionDate - your wcs version date
 */
let setupWcs = function (self, wcsUrl, wcsUsername, wcsPassword, versionDate) {
    try {
        self.conversation = Promise.promisifyAll(
            new Conversation({
                url: wcsUrl,
                username: wcsUsername,
                password: wcsPassword,
                version_date: versionDate
            })
        );
    } catch (err) {
        console.error('Conversation service failure or missing credentials.');
        console.log(err);
        process.exit(0);
    }
};

/**
 * a helper function for conversing with wcs
 */
let callConversation = function (self, request, skillContext) {
    let language = Object.keys(self.wcsCredentials.workspace)[0];
    const payload = {
        workspace_id: self.wcsCredentials.workspace[language].workspace_id,
        context: skillContext,
        input: {text: request.retext}
    };
    // Send the input to the conversation service and return the answer to the callback function
    return self.conversation.messageAsync(payload);
};


/**
 * finds the right action for the request and calls it.
 * @param self
 * @param request
 * @param response
 * @param context
 */
let handleAction = function (self, request, response, context) {
    let intent = request.attributes.intent;
    let state = self.state || 'DEFAULT';
    do {
        // Get action from state
        const action = self.states[state].actions[intent] ||
            self.states[state].actions.unhandled;
        // Run action
        action(request, response, context);
        // Update state
        self.state = response.state || self.state;
        // Next state or stop (we have the response)
        state = response.state;
        intent = response.intent || intent;
        // Clear, will be set by next action call.
        delete response.state;
        delete response.intent;
    } while (state !== undefined);
};

/**
 * Extracts the context from the request
 * @param request
 * @returns the context object
 */
let createContext = function (request) {
    let skillContext = {};
    if (request.context.session.skill && request.context.session.skill.attributes) {
        skillContext = request.context.session.skill.attributes;
    }
    return {
        utterance: request.context.application.attributes,
        session: request.context.session.attributes,
        skill: skillContext
    };
};