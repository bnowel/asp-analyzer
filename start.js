#!/usr/bin/env node

const parseArgs = require('minimist')
const Git = require("simple-git");
const asp_analyzer = require("./asp-analyze.js");
const fs = require("fs");
const nodePath = require("path");
const nodeOs = require("os");
const compareModule = require("./compare.js")({});
const optsBuilder = require('./opts_builder.js');
const mkdirp = require('mkdirp');


(async(runOpts) => {



    var outputDir = runOpts.output;
    var beforeArg = runOpts.before;
    var afterArg = runOpts.after;
    var pathArg = runOpts.dir;
    var compare = runOpts.compare;
    var analysisNameArg = runOpts.analysisName;

    if (!fs.existsSync(outputDir)) {
        console.log("Creating output direcory " + outputDir);
        mkdirp(outputDir);
    }

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
        var beforeStats = await asp_analyzer.analyze(runBeforeOpts);

        await repo.checkout(afterArg);
        console.log("git checkout " + afterArg);

        var runAfterOpts = {
            path: pathArg,
            outputPath: afterPath,
            analysisName: afterArg
        }
        var afterStats = await asp_analyzer.analyze(runAfterOpts);

        compareModule.run({
            before: beforeStats,
            after: afterStats,
            outFile: nodePath.join(outputDir, "compare.csv")
        });
    }
    else {
        // Operate on analysisName
        var opts = {
            path: pathArg,
            //outputPath: afterPath,
            analysisName: analysisNameArg
        }

        var stats = await asp_analyzer.analyze(opts);
    }
    
})(optsBuilder.getOpts());

