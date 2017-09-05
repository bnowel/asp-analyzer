#!/usr/bin/env node

const parseArgs = require('minimist')

const asp_analyzer = require("./asp-analyze.js");

const argOpts = {string: ["path","analysisName"]}
/*  command line arg options
    opts.string - a string or array of strings argument names to always treat as strings
    opts.boolean - a boolean, string or array of strings to always treat as booleans. if true will treat all double hyphenated arguments without equal signs as boolean (e.g. affects --foo, not -f or --foo=bar)
    opts.alias - an object mapping string names to strings or arrays of string argument names to use as aliases
    opts.default - an object mapping string argument names to default values
    opts.stopEarly - when true, populate argv._ with everything after the first non-option
    opts['--'] - when true, populate argv._ with everything before the -- and argv['--'] with everything after the --. Here's an example:
    opts.unknown - a function which is invoked with a command line parameter not defined in the opts configuration object. If the function returns false, the unknown option is not added to argv.
*/
var argv = parseArgs(process.argv.slice(2), argOpts)

var pathArg = argv.path;
if (!pathArg) {
    console.error("--path is required");
    return;
}

var analysisNameArg = argv.analysisName;
if (!analysisNameArg) {
    console.error("--analysisName is required");
    return;
}


const analyzeModule = require("./analyze.js")({});

var runOpts = {
    path:pathArg,
    analysisName:analysisNameArg
}


asp_analyzer.analyze(runOpts);
