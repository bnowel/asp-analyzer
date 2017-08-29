
var analyzeModule = function(opts) {
    const fs = require('fs');
    const json2csv = require('json2csv');

    function run() {
        const analysisJsonFilename = opts.analysisFilename + ".json" || "analysis.json";
        const analysisFilename = opts.analysisFilename + ".csv" || "analysis.csv";

        var statsDict = opts.statsDict || JSON.parse(fs.readFileSync("statsDict.json"));
        var tree = opts.tree || JSON.parse(fs.readFileSync("tree.json"));

        function getLinesOfCode(file, fileTree) {
            var locInIncludes = 0;

            for (var subFile in fileTree) {
                if (tree.hasOwnProperty(subFile)) {
                    locInIncludes += getLinesOfCode(subFile, fileTree[subFile]);
                }
            }
            return statsDict[file].loc + locInIncludes;

        }

        var fields = ["file", "num_includes", "loc", "total_loc"];
        var stats = [];

        for (var file in tree) {
            if (tree.hasOwnProperty(file)) {
                var stat = {};
                stat[fields[0]] = file;
                stat[fields[1]] = statsDict[file].inc.length;
                stat[fields[2]] = statsDict[file].loc;
                stat[fields[3]] = getLinesOfCode(file, tree[file]);
                
                stats.push(stat);
            }
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
    }
    return {
        run: run
    }
}

module.exports = analyzeModule;