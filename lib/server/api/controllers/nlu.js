/*
 © Copyright IBM Corp. 2017
 */


'use strict';
const path = require('path');

const nluFolder = '/res/nlu/';

module.exports = {
    get: get
};

function get(req, res) {
    let type = req.swagger.params.type.value;
    let file = path.join(process.env.skillSDKRootDir, nluFolder, `${type}.json`);

    try {
        // Fore reload
        delete require.cache[require.resolve(file)];
        res.json(require(file));
    } catch (err) {
        res.status(404).send();
    }
}
