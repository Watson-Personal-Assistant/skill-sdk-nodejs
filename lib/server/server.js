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

const assetsFolder = '/assets/';
const keysFileName = 'keys.txt';

// Requireed for testing
module.exports = app;

let config = {
    appRoot: __dirname, // required config
    configDir: __dirname + '/config',
    swaggerSecurityHandlers: {
        api: require('./security/api'),
    }
};

// REST logging
app.use(morgan('short', {
    'stream': {
        write: str => {
            logger.info(str.slice(0, -1));
        }
    }
}));

SwaggerExpress.create(config, function (err, swaggerExpress) {

    if (err) {
        throw err;
    }


    // Add swagger-ui (This must be before swaggerExpress.register)
    app.use(swaggerUi(swaggerExpress.runner.swagger));

    // Redirect to swagger page
    app.get('/', (req, res) => res.redirect('/docs'));

    // install middleware
    swaggerExpress.register(app);

    var port = process.env.PORT || 10011;
    logger.info(`Start server on port ${port}`);
    app.listen(port);


});
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
    let key = req.header('expertiseKey') || req.query['api_key'];

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
    logger.info('key does not match');
    return false;
};