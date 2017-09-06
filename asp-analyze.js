
const pathModule = require('path');
const clif = require('count-lines-in-file');
const fs = require('fs');
const glob = require("glob");
const treeModule = require("./transform_tree.js");
const treeBuilder = treeModule();
const analyzeModule = require("./analyze.js")({});
const globOptions = {realpath: true};
const regex = /((<!--\s*#include\s+\w+\s*=\s*")(.+.asp)("\s*-->))/g;



async function analyzeStart(opts) {


    var resolvedPath = pathModule.resolve(opts.path);
    var analysisRoot = (resolvedPath + pathModule.sep).toLowerCase();
    console.log("Analyzing: " + analysisRoot);
    var allFiles;
    var totalTree;
    
    try {
        var globFiles = await globAsync(opts.path + "/**/*.asp", globOptions)
        
        allFiles = globFiles.map(function(file) {return file.toLowerCase()});
        
        var fileStats = await Promise.all(allFiles.map(buildFileStats));

        var totalStatsDict = convertArray(fileStats); 
        totalTree = treeBuilder.buildDictTree(totalStatsDict); 
        
        var statsArr = analyzeModule.run({
            statsDict: totalStatsDict,
            tree: totalTree,
            analysisFilename: opts.analysisName
        });

        var flatTree = buildFlatTree(statsArr);

        await Promise.all([
            writeFileAsync("allFiles.json", JSON.stringify(allFiles, null, 2)),
            writeFileAsync("fileStats.json", JSON.stringify(fileStats, null, 2)),
            writeFileAsync("statsDict.json", JSON.stringify(totalStatsDict, null, 2)),
            writeFileAsync("tree.json", JSON.stringify(totalTree, null, 2)),
            writeFileAsync("distinctIncludes.json", JSON.stringify(flatTree, null, 2))
        ]);
    } catch(e) {
        console.log(e);
    }

    function buildFlatTree(statsArray){
        var topLevelFiles = statsArray.filter(function(elem) {
            return elem.num_refs <= 0;
        });
    
        var topLevelFileNames = topLevelFiles.map(function(elem) {
            return elem.file;
        });
    
        var topLevelTree = {};
        for (var i = 0; i < topLevelFileNames.length; i++) {
            var file = topLevelFileNames[i];
            topLevelTree[file] = totalTree[file];
        }
    
        return treeBuilder.flattenTree(topLevelTree)
    }
    
    function buildFileStats(file) {
    
        return new Promise(function(resolve, reject){
            clifAsync(file).then((num) => {
    
                fs.readFile(file, function(err, data){
                    let m;
                    let includes = [];
                    let dirname = pathModule.dirname(file)
                    let filename = file.replace(analysisRoot, "")
                    while ((m = regex.exec(data)) !== null) {
                        let match = m[3];
                        let fullIncFile = match.startsWith("/") ? pathModule.resolve(analysisRoot, match.substring(1)) : pathModule.resolve(dirname, match)
                        let incFile = fullIncFile.toLowerCase().replace(analysisRoot, "")
                        
                        // Make sure that the reference we resolve exists on the filesystem
                        var fileExists = allFiles.find(x => x == fullIncFile.toLowerCase());
                        if (fileExists) {
                            // Add only valid includes
                            includes.push(incFile)
                        }
                        else {
                            if (opts.warnings){
                                console.warn("[" + file + "] '" + match + "'\n\tCan't find: " + fullIncFile);
                            }
                        }
                    }
                    resolve({name: filename, loc: num, inc: includes})
                });
            });
        });
    }
    
    function convertArray(array) {
        var obj = {};
    
        array.map(function(elem) {
            doElemWork(elem, obj);
        });
    
        return obj;
    }
    
    function doElemWork(elem, obj) {
        obj[elem.name] = {inc: elem.inc, loc: elem.loc};
    }
    
    
    function globAsync(pattern, options){
        return new Promise(function(resolve, reject) {
            glob(pattern, options, function(err, files) {
                 if (err !== null) return reject(err);
                 resolve(files);
            });
        });
    }
    
    
    function clifAsync(file) {
        return new Promise(function(resolve, reject) {
             clif(file, function(err, number) {
                 if(err !== null) return reject(err);
                 resolve(number);
             });
        });
    }

    function writeFileAsync(filename, content, callback) {
        return new Promise(function(resolve, reject) {
            fs.writeFile(filename, content, (err) => {
                if (!!callback)
                    callback(err);

                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
}

module.exports = {
    analyze : analyzeStart
}
