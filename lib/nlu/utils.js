/*
© Copyright IBM Corp. 2017
*/



'use strict';


/**
 * check that all the WA env var credentials exist
 * @returns {string}
 */
let isValidWaEnvVars = function() {
    return (((process.env.WCS_USERNAME && process.env.WCS_URL && process.env.WCS_PASSWORD && process.env.WCS_VERSION_DATE
        && process.env.WCS_VERSION) ||
        (process.env.WA_API_KEY && process.env.WCS_VERSION_DATE)) &&
        (process.env.WCS_WORKSPACE_ID && process.env.WCS_WORKSPACE_NAME &&
            process.env.WCS_WORKSPACE_LANGUAGE));
};

/**
 * check that all the WA credentials sent from the skill are valid
 * @returns {string}
 */

let isValidWaCredentials = function(credentials) {
    return ((process.env.WCS_USERNAME && process.env.WCS_URL && process.env.WCS_PASSWORD && process.env.WCS_VERSION_DATE
        && process.env.WCS_VERSION) ||
        (credentials.apikey && process.env.WCS_WORKSPACE_LANGUAGE && credentials.workspace_name && credentials.workspace_name && credentials.url));     
};


/**
 * Sets up the handler's wcs credentials from environment variables
 * @param handler
 */

let setupWCSCredentialsFromEnv = function () {
    let options = {
        "workspace": {
            [process.env.WCS_WORKSPACE_LANGUAGE]: {
                "name": process.env.WCS_WORKSPACE_NAME,
                "workspace_id": process.env.WCS_WORKSPACE_ID
            }
        }
    };
    // new way of wa authentication - with iam api-key
    if(process.env.WA_API_KEY) {
        options.credentials = {
            "url": process.env.WCS_URL,
            "version": process.env.WCS_VERSION_DATE,
            "iam_apikey": process.env.WA_API_KEY
        }
    }
    // deprecated way of wa authentication
    else if(process.env.WCS_PASSWORD && process.env.WCS_USERNAME) {
        options.credentials = {
            "url": process.env.WCS_URL,
            "version": process.env.WCS_VERSION,
            "version_date": process.env.WCS_VERSION_DATE,
            "password": process.env.WCS_PASSWORD,
            "username": process.env.WCS_USERNAME
        }
    }
    return options;
};

/**
 * Sets up the handler's wcs credentials from VCAP credentials read from the skill
 * @param handler
 */

let setupWCSCredentialsfromVCAP = function (credentials) {

    let options = {
        "workspace": {
            [process.env.WCS_WORKSPACE_LANGUAGE]: {
                "name": credentials.workspace_name,
                "workspace_id": credentials.workspace_id
            }
        }
    };
    // new way of wa authentication - with iam api-key
    if(credentials.apikey) {
        options.credentials = {
            "url": credentials.url,
            "version": credentials.version_date,
            "iam_apikey": credentials.apikey
        }
    }
    // deprecated way of wa authentication
    else if(process.env.WCS_PASSWORD && process.env.WCS_USERNAME) {
        options.credentials = {
            "url": process.env.WCS_URL,
            "version": process.env.WCS_VERSION,
            "version_date": process.env.WCS_VERSION_DATE,
            "password": process.env.WCS_PASSWORD,
            "username": process.env.WCS_USERNAME
        }
    }
    return options;

};


module.exports = {
    isValidWaEnvVars: isValidWaEnvVars,
    isValidWaCredentials: isValidWaCredentials,
    setupWCSCredentialsFromEnv: setupWCSCredentialsFromEnv,
    setupWCSCredentialsfromVCAP: setupWCSCredentialsfromVCAP
};