//instrument function
let instrument = {};

instrument.entryTime = function (payload, measurement, parent) {
    if (payload && payload.internal && payload.internal.performance && (process.env.PERFORMANCE === 'true')) {
        payload.internal.performance.skill = payload.internal.performance.skill || {};
        let currRoot = payload.internal.performance.skill;

        if (parent) {
            payload.internal.performance.skill[parent] = payload.internal.performance.skill[parent] || {};
            currRoot = payload.internal.performance.skill[parent];
        }

        currRoot[measurement] = {};
        currRoot[measurement].start = Date.now();
    }
};

instrument.exitTime = function (payload, measurement, parent) {
    if (process.env.PERFORMANCE === 'true' && payload &&  payload.internal && payload.internal.performance &&
        payload.internal.performance.skill) {
        let currRoot = payload.internal.performance.skill;

        if (parent) {
            payload.internal.performance.skill[parent] = payload.internal.performance.skill[parent] || {};
            currRoot = payload.internal.performance.skill[parent];
        }

        if (currRoot[measurement]) {
            currRoot[measurement].end = Date.now();
        }
    }
};

module.exports = instrument;

