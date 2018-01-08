const ErrorCodes = require('./response-codes');

function EvaluationResponse(callback) {
    this.callback = callback;
    this.response = {
        responseCode: ErrorCodes.ok,
        requestResult: {},
        intentConfidence: {},
        handleUtterance: true,
        context: {
        }

    };
}

EvaluationResponse.prototype.send = function(result) {
    this.response.requestResult = result;
    if (this.state === undefined) {
        this.callback(this.response);
    }
};

EvaluationResponse.prototype.reject = function() {
    this.response.handleUtterance = false;
    if(this.state === undefined) {
        this.callback(this.response);
    }
};

module.exports = EvaluationResponse;
