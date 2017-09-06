#!/usr/bin/env node

const parseArgs = require('minimist')
const Git = require("simple-git");
const asp_analyzer = require("./asp-analyze.js");

const argOpts = {string: ["path", "analysisName", "before", "after"]}
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

var beforeArg = argv.before;
var afterArg = argv.after;
var hasBeforeAndAfterArgs = false;

if ((!afterArg && beforeArg) || (afterArg && !beforeArg)) {
    console.error("Must pass --before and --after");
    return;
} else {
    hasBeforeAndAfterArgs = true;
}

var analysisNameArg = argv.analysisName;
if (!analysisNameArg && !hasBeforeAndAfterArgs) {
    console.error("--analysisName is required");
    return;
}

async function awaitAnalyze(opts) {
    return await asp_analyzer.analyze(opts);
}

(async() => {
    if (beforeArg) {
        var repo = Git(pathArg);


        await repo.checkout(beforeArg);
        console.log("git checkout " + beforeArg);

        var runBeforeOpts = {
            path:pathArg,
            analysisName:beforeArg
        }
        await awaitAnalyze(runBeforeOpts);
        console.log("Before Done");

        await repo.checkout(afterArg);
        console.log("git checkout " + afterArg);

        var runAfterOpts = {
            path:pathArg,
            analysisName:afterArg
        }
        await awaitAnalyze(runAfterOpts);
        console.log("After Done");

    }
    else {
        // Operate on analysisName
    }
    
})();

