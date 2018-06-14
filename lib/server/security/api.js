/*
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2017. All Rights Reserved.
 */
const logger = require('winston');

/**
 * Return a promise with the authentication of other "things" that can use this API
 * @method authenticate
 * @param  {string}     apikey the key that is passed into this api
 * @return {object}            if successfully passes security check, it passses
 * control to the callback; otherwise passes error object to the callback
 */
function authenticate(apikey) {
    //no authentication required so return true
    if (!process.env.AUTHENTICATE_REQUESTS) {
        return Promise.resolve(true);
    }
    //multiple keys in an array
    if (process.env.API_KEY.split(',').indexOf(apikey) >= 0) {
        return Promise.resolve(true);
    }
    return Promise.reject(new Error("Unauthorized access attempt.  API Key missing or incorrect."));
}

module.exports = (req, securityDefinition, apiKey, cb) => {
    authenticate(apiKey)
        .then((result) => {
            logger.info(`authenticated with apiKey ${apiKey}`);
            cb();
        })
        .catch((err) => {
            logger.error(err.message);
            const error = new Error('Unauthorized access request. Incorrect API key.');
            error.statusCode = 401;
            cb(error);
        });
};