
var analyzeModule = function(moduleOpts) {
    const fs = require('fs');
    const pathModule = require('path');
    const json2csv = require('json2csv');

    function run(opts) {
        var outputPath = opts.outputPath || ".";

        function getOutputPath(filename) {
            return pathModule.join(outputPath, filename);
        }

        const analysisJsonFilename = getOutputPath(opts.analysisFilename + ".json" || "analysis.json");
        const analysisFilename = getOutputPath(opts.analysisFilename + ".csv" || "analysis.csv");

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
        fs.writeFile(analysisJsonFilename, JSON.stringify(stats), function(err) {
            if (err)
                throw error;
            console.log(analysisJsonFilename + " saved.");
        });

        fs.writeFile(analysisFilename, csv, function(err) {
            if (err)
                throw err;
            console.log(analysisFilename + " saved.");
        });

        return stats;
    }
    return {
        run: run
    }
}

module.exports = analyzeModule;