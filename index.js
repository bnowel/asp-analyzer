module.exports = function(opts){
    var analyzeOpts = {}
    if (opts && opts.analyze){
        Object.assign(analyzeOpts,opts.analyze);
    }
    const analyzeModule = require("./lib/analyze.js")(analyzeOpts);

    return {
        analyze : analyzeModule.startAnalyze,
        compare : analyzeModule.startCompare
    };
};