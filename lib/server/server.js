/*
 © Copyright IBM Corp. 2017
 */


'use strict';

const SwaggerExpress = require('swagger-express-mw');
const swaggerUi = require('swagger-tools/middleware/swagger-ui');
const app = require('express')();
const morgan = require('morgan');
const logger = require('../logger');
const fs = require('fs');
const path = require('path');
const url = require('url');
let querystring = require('querystring');
const cluster = require('express-cluster');


const assetsFolder = '/assets/';
const keysFileName = 'keys.txt';

// Requireed for testing
module.exports = app;

let config = {
    appRoot: __dirname, // required config
    configDir: __dirname + '/config'
};

// REST logging
app.use(morgan('short', {
    'stream': {
        write: str => {
            logger.info(str.slice(0, -1));
        }
    }
}));

// Checks that the request for the expertise came from the core
app.all('/*', function (req, res, next) {
    if (req.headers.expertisekey) {
        req.skillKey = req.headers.expertisekey;
    } else if (req.headers.skillkey) {
        req.skillKey = req.headers.skillkey;
    }
    // check only if defined to be a secured expertise
    if (process.env.AUTHENTICATE_REQUESTS && JSON.parse(process.env.AUTHENTICATE_REQUESTS.toLowerCase())) {
        let coreKey = "";
        let valid = false;
        let isConverse = (req.url.indexOf('converse') > 0);
        let isEvaluate = (req.url.indexOf('evaluate') > 0);
        let isDocs = (req.url.indexOf('api-docs') > 0);
        // let is_manifest = (req.url.indexOf('manifest') > 0);
        // let is_healthcheck = (req.url.indexOf('healthcheck') > 0);
        if (isConverse || isDocs || isEvaluate) {
            coreKey = getKey(req);
            valid = authenticate(coreKey);
        }
        else {
            valid = true;
        }
        // check if key is in the list of key and is not undefined
        // let is_manifest = req.url.indexOf('manifest');
        if (!valid) {
            logger.info('Authentication failed, key: ' + coreKey + "\n request url: " + req.url);
            res.send(401)
        } else {
            logger.info('Authentication succeeded, key: ' + coreKey + "\n request url: " + req.url);
            next();
        }
    }
    else {
        next();
    }
});


SwaggerExpress.create(config, function (err, swaggerExpress) {
    if (process.env.CLUSTER === 'true') {
        let numCPU = require('os').cpus().length;
        logger.info('starting ' + numCPU + ' server workers');
        cluster(function (worker) {
            if (err) {
                logger.error('error with worker: ' + err);
                throw err;
            }

            runServer(swaggerExpress)
        }, {count: numCPU})

    } else {
        runServer(swaggerExpress)
    }
});

let runServer = function (swaggerExpress) {
    // Add swagger-ui (This must be before swaggerExpress.register)
    app.use(swaggerUi(swaggerExpress.runner.swagger));

    // Redirect to swagger page
    app.get('/', (req, res) => res.redirect('/docs'));

    // install middleware
    swaggerExpress.register(app);

    let port = process.env.PORT || 10011;
    logger.info(`Start server on port ${port}`);
    app.listen(port);
}

let getKeys = function () {
    return fs.readFileSync(path.join(process.env.skillSDKResDir, assetsFolder, keysFileName), 'utf8', function (err, contents) {
        if (err) {
            logger.info('could not read keys file, error: ' + err);
            return "";
        }
        return contents;
    }).split('\n');
};

let getKey = function (req) {
    let key = req.header('expertiseKey') || req.header('skillKey') || req.query['api_key'];

    if (!key) {
        let query;

        let referer = req.headers.referer;
        if (referer) {
            let parsedUrl = url.parse(req.headers.referer);
            query = querystring.parse(parsedUrl.query);
        } else {
            query = req.query;
        }

        key = query['api_key'];
    }

    return (key);
};


let authenticate = function (core_key) {
    // check if the core key is found in the list of keys
    let keys = getKeys();
    for (let i = 0; i < keys.length; ++i) {
        if (keys[i] === core_key) {
            return true;
        }
    }
    logger.info('Key does not match');
    return false;
};
