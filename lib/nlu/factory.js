/*
© Copyright IBM Corp. 2017
*/


/* jshint expr:true */

'use strict';

const reflect = require('promise-reflect');
const logger = require('../logger');
const {getSupportedBuiltIn} = require('./supported');
const {getSupportedUser} = require('./supported');
const errors = require('../error-responses');
const fs = require('fs');
const resPath = process.env.skillSDKResDir;


/**
 * Factory for creating NLU engines. The NLU engines that can be created by
 * this factory should be suppoorted by the core. ALl NLU engines should exists
 * in folder .../bundles/nlu.
 */
class Factory {

    /**
     * Create a single NLU engine from the specifed type. If the specified is not
     * supported, the function rejects the promise.
     *
     * @param  {string} url  Expertise URL
     * @param  {string} type NLU engine type
     * @param  {string} name Expertise name
     * @return {Object}      NLU engine
     */
    static create(nlu) {
        return new Promise(function (resolve, reject) {
            let type = nlu.type;
            let path = '';
            if (getSupportedBuiltIn().indexOf(type) !== -1) {
                path = `./bundles/engines/${type}/nlu`
            }
            else if (getSupportedUser().indexOf(type) !== -1) {
                path = `${resPath}/nlu/engines/${type}/nlu`;
            }
            else {
                // Not a valid NLU type, should not get here because invalid nlu types
                // are supposed to be discarded in getNlu
                reject(errors.invalidNluType(nlu.type));
                return
            }
            const Nlu = require(path);
            const engine = new Nlu(nlu.name);
            engine.init(nlu).then(resolve).catch(reject);

        });
    }

    /**
     * Create all NLU engines. The function will use the specified URL to query
     * NLU data.
     * The function always resolve with the created engines, empty if none was
     * created.
     *
     * @param  {string} url  Expertise URL
     * @param  {string} name Expertise name
     * @return {Array}       Created NLU engines. Empty if no engine was created.
     */
    static createAll(manifest) {
        return new Promise(function (resolve, reject) {
            var promises = [];
            let types = Object.keys(manifest.nlu);

            // Use supported if not defined. Type will be validate on create.
            if (types === undefined) {
                logger.warn(`${name} doesn't specify nlu types`);
                types = manifest.nlu;
            }
            types.forEach(function (type) {
                promises.push(Factory.create(manifest.nlu[type]));
                logger.info(`Creating ${type} nlu engine`);
            });
            Promise.all(promises.map(reflect)).then(function (results) {
                const engines = [];
                let counter = 1;
                results.forEach(function (result) {
                    let resultMessage = result.status === 'resolved' ? 'succeeded' : 'failed';
                    logger.info(`Nlu engine ${types[counter++ - 1]} creation has ${resultMessage}`);
                    (result.status === 'resolved') && engines.push(result.data);
                });
                resolve(engines);
            });
        });
    }


    static getNLUs(manifest) {
        return new Promise(function (resolve, reject) {
            let promises = [];
            let types = manifest.nlu;
            types.forEach(function (type) {
                promises.push(getNLU(type, manifest.name));
            });

            Promise.all(promises.map(reflect)).then(function (results) {
                manifest.nlu = {};

                results.forEach(function (result) {
                    if (result.status === 'resolved') {
                        let nlu = result.data;
                        manifest.nlu[nlu.type] = nlu;
                    }
                });

                resolve(manifest);
            });
        });
    }

}

module.exports = Factory;


function getNLU(type, name) {
    return new Promise(function (resolve, reject) {
            let nlu;
            if(process.env.WCS_USERNAME && process.env.WCS_URL && process.env.WCS_PASSWORD && process.env.WCS_VERSION_DATE
                && process.env.WCS_VERSION && process.env.WCS_WORKSPACE_ID && process.env.WCS_WORKSPACE_NAME &&
                process.env.WCS_WORKSPACE_LANGUAGE) {
                nlu = createNLUFromEnv();
            } else {
                nlu = require(`${resPath}/nlu/${type}`);
            }
            if (!nlu) {
                reject(errors.couldNotReadNluType);
            }
            nlu.name = name;
            nlu.type = type;
            resolve(nlu)
    }).catch(function(err) {
        logger.error(errors.couldNotReadNluType(type));
        next();
    })
}

function createNLUFromEnv() {
    return {
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
    };
}
