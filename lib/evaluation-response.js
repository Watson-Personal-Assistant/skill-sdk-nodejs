const ErrorCodes = require('./response-codes');

function EvaluationResponse(callback) {
    this.callback = callback;
    this.response = {
        responseCode: ErrorCodes.ok,
        requestResult: {},
        intentities: [],
        threshold: 0.85,
        handleUtterance: true,
        routeByEntities: true,
        context: {
        },
        internal:{
            performance: undefined
        },
        actions: []
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

EvaluationResponse.prototype.setRoutingByEntities = function(value) {
    if(typeof(value) !== 'boolean') {
        console.warn('Could not set RouteByEntities flag, given value was not a boolean');
    } else {
        this.response.routeByEntities = value;
    }
    return this;
};

module.exports = EvaluationResponse;
