//const fs = require("fs");
const nodePath = require("path");

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

        predict(predictObj);
    }

    function predict(predictObj)
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

        console.log(fileToMove.file);
    }

    return {
        predictFromFiles:predictFromFiles,
        predict:predict
    };
};

module.exports = predictModule;