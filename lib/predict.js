//const fs = require("fs");
const nodePath = require("path");
const analyzeModule = require("./analyze.js")({});
const compareModule = require("./compare.js")({});

const mkdirp = require("mkdirp");
var predictModule = function(incomingOpts) {
    var defaultOpts = {};
    Object.assign(defaultOpts,incomingOpts);

    function predictFromFiles(directory)
    {
        /*
            writeJsonAsync("allFiles.json", allFiles),
            writeJsonAsync("fileStats.json", fileStats),
            writeJsonAsync("statsDict.json", totalStatsDict),
            writeJsonAsync("tree.json", totalTree),
            writeJsonAsync("distinctIncludes.json", flatTree),
        */

        var fnames = ["allFiles", "fileStats", "statsDict", "tree", "distinctIncludes","analysis"];
        var predictObj = {};
        fnames.forEach(function(fname){
            let fpath = nodePath.join(directory, fname);
            predictObj[fname] = require(fpath);
        });

        predict(predictObj, directory);
    }

    async function predict(predictObj, outputPath)
    {
        //fornow, just use the highest refcount
        //array of analyzed files  : predictObj.analysis.
/*
predictObj.analysis[1]
Object {file: "web/asp/json2.asp", num_includes: 0, loc: 1042, total_loc: 1042, num_refs: 12360}
file:"web/asp/json2.asp"
loc:1042
num_includes:0
num_refs:12360
total_loc:1042
*/
        predictObj.analysis.sort(function(a,b){return b.num_refs - a.num_refs});
        
        var fileToMove = predictObj.analysis[0];

        var fname = fileToMove.file;
        console.log(fname);



        predictObj.fileStats.forEach(function(file, index,arr){
            let i = file.inc.findIndex(function(val, index, arr2){
                if (val == fname){
                    return true;
                }
                return false;
            });
            file.inc.splice(i,1);
        });

        var newPath = nodePath.join(outputPath, "predict");
        mkdirp(newPath);
        var statsObj = await analyzeModule.buildAndWriteStats(predictObj.fileStats,newPath,predictObj.allFiles);

        compareModule.compareStats({
            before: {statsArr:predictObj.analysis,distinctIncludes:predictObj.distinctIncludes},
            after: {statsArr:statsObj.analysisObj.data,distinctIncludes:statsObj.flatTree},
            outFile: nodePath.join(newPath, "compare.csv"),
            summary:true,
            warnings: false
        });

        return {
            statsArr:statsObj.analysisObj.data,
            distinctIncludes:statsObj.flatTree
        };
    }

    return {
        predictFromFiles:predictFromFiles,
        predict:predict
    };
};

module.exports = predictModule;