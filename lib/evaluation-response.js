const ErrorCodes = require('./response-codes');

function EvaluationResponse(callback) {
    this.callback = callback;
    this.response = {
        responseCode: ErrorCodes.ok,
        requestResult: {},
        intentities: [],
        handleUtterance: true,
        context: {
        },
        performance: undefined
    };
}

EvaluationResponse.prototype.send = function(result) {
    this.response.requestResult = result;
    this.callback(undefined, this.response);
};

EvaluationResponse.prototype.rejectUtterance = function() {
    this.response.handleUtterance = false;
    return this;
};

module.exports = EvaluationResponse;
