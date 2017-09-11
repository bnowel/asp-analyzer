#!/usr/bin/env node

const asp_analyzer = require("./analyze.js")({});
const optsBuilder = require("./opts_builder.js");

var opts = optsBuilder.getOpts();
if (opts.before){
    asp_analyzer.startCompare(opts);    
}else{
    asp_analyzer.startAnalyze(opts);    
}
