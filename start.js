#!/usr/bin/env node

const parseArgs = require('minimist')
const Git = require("simple-git");
const asp_analyzer = require("./asp-analyze.js");
const fs = require("fs");
const nodePath = require("path");
const nodeOs = require("os");

const argOpts = {string: ["path", "analysisName", "before", "after", "output"]}
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

// Store our stuff on the desktop
var outputDir = nodePath.join(nodeOs.homedir(), "desktop/asp-analyze");

var outputArg = argv.output;

if (!outputArg) {
    console.log("--output not specified.  Using the default directory: " + outputDir);
}
else {
    outputDir = outputArg;
}

outputDir = nodePath.join(outputDir, getDateTimeForPath());

if (!fs.existsSync(outputDir)) {
    console.log("Creating output direcory " + outputDir);
    fs.mkdirSync(outputDir);
}


async function awaitAnalyze(opts) {
    return await asp_analyzer.analyze(opts);
}

function getBranchPath(outputPath, branch) {
    return nodePath.join(outputPath, branch.substring(0, 12));
}

function getDateTimeForPath() {
    var now = new Date();
    
    return now.getFullYear() + "" + (now.getMonth() + 1) + "" + now.getDate() + "-" + now.getHours() + "" + now.getMinutes() + "" + now.getSeconds();
}

(async() => {
    if (beforeArg) {
        var repo = Git(pathArg);
        var beforePath = getBranchPath(outputDir, beforeArg);
        var afterPath = getBranchPath(outputDir, afterArg);

        fs.mkdirSync(beforePath);
        fs.mkdirSync(afterPath);

        await repo.checkout(beforeArg);
        console.log("git checkout " + beforeArg);

        var runBeforeOpts = {
            path: pathArg,
            outputPath: beforePath,
            analysisName: beforeArg
        }
        await awaitAnalyze(runBeforeOpts);

        await repo.checkout(afterArg);
        console.log("git checkout " + afterArg);

        var runAfterOpts = {
            path: pathArg,
            outputPath: afterPath,
            analysisName: afterArg
        }
        await awaitAnalyze(runAfterOpts);

    }
    else {
        // Operate on analysisName
    }
    
})();

