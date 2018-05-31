//instrument function
let instrument = {};

instrument.entryTime = function (payload, measurement, parent) {
    if (payload && payload.performance && (process.env.PERFORMANCE === 'true')) {
        payload.performance.skill = payload.performance.skill || {};
        let currRoot = payload.performance.skill;

        if (parent) {
            payload.performance.skill[parent] = payload.performance.skill[parent] || {};
            currRoot = payload.performance.skill[parent];
        }

        currRoot[measurement] = {};
        currRoot[measurement].start = Date.now();
    }
};

instrument.exitTime = function (payload, measurement, parent) {
    if (process.env.PERFORMANCE === 'true' && payload && payload.performance &&
        payload.performance.skill) {
        let currRoot = payload.performance.skill;

        if (parent) {
            payload.performance.skill[parent] = payload.performance.skill[parent] || {};
            currRoot = payload.performance.skill[parent];
        }

        if (currRoot[measurement]) {
            currRoot[measurement].end = Date.now();
        }
    }
};

module.exports = instrument;

