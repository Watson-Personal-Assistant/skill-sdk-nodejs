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
const instrument = require('./instrument.js');

const nluFolder = '/nlu';
const wcsFileName = '/wcs.json';

let Handler = function () {
    this.states = {};
};

/**
 * Initializes the handler, sets up the connection to wcs
 */
Handler.prototype.initialize = function () {
    if(process.env.WCS_USERNAME && process.env.WCS_URL && process.env.WCS_PASSWORD && process.env.WCS_VERSION_DATE
        && process.env.WCS_VERSION && process.env.WCS_WORKSPACE_ID && process.env.WCS_WORKSPACE_NAME &&
        process.env.WCS_WORKSPACE_LANGUAGE) {
        setupWCSCredentialsFromEnv(this);
    } else {
        let rawJson = fs.readFileSync(path.join(process.env.skillSDKResDir, nluFolder, wcsFileName));
        this.wcsCredentials = JSON.parse(rawJson);
    }
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
    if(!this.engines || this.engines.length < 1) {
        callback({responseCode: 500, requestResult: errors.noNluDeclared()});
        return;
    }

    let evaluationResponse = new EvaluationResponse((err, result) => {
        instrument.exitTime(evaluationResponse.response, "evaluate");
        saveContext(this, request, context, evaluationResponse);
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

        evaluationResponse.response.performance = request.performance;
        instrument.entryTime(evaluationResponse.response, "evaluate");
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
            evaluationResponse.response.intentities = intentResult;
            let textResponse;
            if(output) {
                context.skill = output.context ? output.context : {};
                textResponse = output.text ? output.text : undefined;
            }
            callback(textResponse, evaluationResponse, context, undefined);

        }
    });
};

Handler.prototype.handleRequest = function (request, callback) {
    logger.info('Request', JSON.stringify(request));
    // State and session context for short access
    let context = createContext(request);
    this.state = request.context.session.attributes.state;
    // Update language
    i18.changeLanguage(request.language);
    let response;
    // callback function to be used by the response objects
    let responseCallback = function (err, result) {
        instrument.exitTime(response.response, "action");

        saveContext(this, request, context, response);
        // Log the response
        logger.info('Response', response.response);
        // Return the response
        callback(err, response.response);
    };
    response = new Response(responseCallback);
    response.response.performance = request.performance;

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
    instrument.entryTime(response.response, 'callConversation');
    callConversation(this, request, context.skill).then(result => {
        instrument.exitTime(response.response, 'callConversation');
        // Save the context of the watson conversation service
        context.skill = result.context;
        callback(result, response, context, undefined);
    }).catch(err => {
        callback(undefined, response, context, err);
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


Handler.prototype.saveEvaluationContext = function (context, evaluationContext) {
    context.skill = evaluationContext.session.skill.attributes;
    context.session = evaluationContext.session.attributes;
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
    const payload = {
        workspace_id: self.wcsCredentials.workspace[request.language].workspace_id,
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

        instrument.entryTime(response.response, "action");
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

/**
 * Saves context to a response object
 * @param self
 * @param request
 * @param context
 * @param response
 */
let saveContext = function (self, request, context, response) {
    request.context.session.attributes.state = self.state;
    if(response.response.context && response.response.context.inConversation !== undefined) {
        context.skill.inConversation = response.response.context.inConversation;
    }
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

/**
 * Sets up the handler's wcs credentials from environment variables
 * @param self
 */

let setupWCSCredentialsFromEnv = function (self) {
    self.wcsCredentials = {
        "workspace": {
            [process.env.WCS_WORKSPACE_LANGUAGE]: {
                "name": process.env.WCS_WORKSPACE_NAME,
                "workspace_id": process.env.WCS_WORKSPACE_ID
            }
        },
        "credentials": {
            "url": process.env.WCS_URL,
            "version": process.env.WCS_VERSION,
            "version_date": process.env.WCS_VERSION_DATE,
            "password": process.env.WCS_PASSWORD,
            "username": process.env.WCS_USERNAME
        }
    }
};