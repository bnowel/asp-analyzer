
var analyzeModule = function(moduleOpts) {
    const fs = require('fs');
    const pathModule = require('path');
    const json2csv = require('json2csv');
    const mkdirp = require('mkdirp');
    const asp_analyzer = require('./asp-analyze.js');
    const compareModule = require('./compare.js')({});
    const Git = require('simple-git');


    function run(opts) {
        var outputPath = opts.outputPath || ".";

        function getOutputPath(filename) {
            return pathModule.join(outputPath, filename);
        }

        const analysisJsonFilename = getOutputPath( "analysis.json");
        const analysisFilename = getOutputPath("analysis.csv");

        var statsDict = opts.statsDict || JSON.parse(fs.readFileSync(getOutputPath("statsDict.json")));
        var tree = opts.tree || JSON.parse(fs.readFileSync(getOutputPath("tree.json")));

        function getLinesOfCode(file, fileTree) {
            var locInIncludes = 0;

            for (var subFile in fileTree) {
                if (tree.hasOwnProperty(subFile)) {
                    locInIncludes += getLinesOfCode(subFile, fileTree[subFile]);
                }
            }
            return statsDict[file].loc + locInIncludes;

        }

        var fields = ["file", "num_refs", "num_includes", "loc", "total_loc"];
        var stats = [];
        var allRefs = {};

        function updateRefCounts(file, fileTree) {
            for (var subFile in fileTree) {
                if (tree.hasOwnProperty(subFile)) {
                    updateRefCounts(subFile, fileTree[subFile]);
                }
            }
            
            if (typeof allRefs[file] === "undefined")
                allRefs[file] = 0;
            else
                allRefs[file]++
        }

        for (var file in tree) {
            if (tree.hasOwnProperty(file)) {
                var stat = {};
                stat[fields[0]] = file;
                stat[fields[2]] = statsDict[file].inc.length;
                stat[fields[3]] = statsDict[file].loc;
                stat[fields[4]] = getLinesOfCode(file, tree[file]);
                
                updateRefCounts(file, tree[file]);

                stats.push(stat);
            }
        }

        for (var i = 0; i < stats.length; i++) {
            var stat = stats[i];
            
            stat[fields[1]] = allRefs[stat[fields[0]]];
        }

        var csv = json2csv({data: stats, fields: fields});
        fs.writeFileSync(analysisJsonFilename, JSON.stringify(stats, null, 2));
        console.log(analysisJsonFilename + " saved.");
        

        fs.writeFileSync(analysisFilename, csv);
        console.log(analysisFilename + " saved.");
        

        return stats;
    }
    // Truncate the branch because it could be a SHA which would be HUGE
    function getBranchPath(outputPath, branch) {
        return pathModule.join(outputPath, branch.substring(0, 12));
    }

    async function start(runOpts)  {
        
        
        
            var outputDir = runOpts.output;
            var beforeArg = runOpts.before;
            var afterArg = runOpts.after;
            var pathArg = runOpts.dir;
            var compare = runOpts.compare;
            var analysisNameArg = runOpts.analysisName;
            var summaryArg = runOpts.summary
        
            if (!fs.existsSync(outputDir)) {
                console.log("Creating output directory " + outputDir);
                mkdirp(outputDir);
            }
        
            if (beforeArg) {
                var repo = Git(pathArg);
                var beforePath = getBranchPath(outputDir, beforeArg);
                var afterPath = getBranchPath(outputDir, afterArg);
        
                fs.mkdirSync(beforePath);
                fs.mkdirSync(afterPath);
                

                console.log("Analyzing: " + pathArg);

                await repo.checkout(beforeArg);
                console.log("git checkout " + beforeArg);
        
                var runBeforeOpts = {
                    path: pathArg,
                    outputPath: beforePath,
                    analysisName: beforeArg,
                    summary:false
                }
                var beforeStats = await asp_analyzer.analyze(runBeforeOpts);
        
                await repo.checkout(afterArg);
                console.log("git checkout " + afterArg);
        
                var runAfterOpts = {
                    path: pathArg,
                    outputPath: afterPath,
                    analysisName: afterArg,
                    summary:false
                }
                var afterStats = await asp_analyzer.analyze(runAfterOpts);
        
                compareModule.run({
                    before: beforeStats,
                    after: afterStats,
                    outFile: pathModule.join(outputDir, "compare.csv"),
                    summary:summaryArg
                });
            }
            else {
                // Operate on analysisName
                var opts = {
                    path: pathArg,
                    outputPath: outputDir,
                    analysisName: analysisNameArg,
                    summary : summaryArg
                }
        
                var stats = await asp_analyzer.analyze(opts);
            }
            
        }


    return {
        run: run,
        start: start
    }
}

module.exports = analyzeModule;