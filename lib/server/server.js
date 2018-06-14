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