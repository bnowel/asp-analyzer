#!/usr/bin/env node

const parseArgs = require('minimist')
const pathModule = require('path');
const clif = require('count-lines-in-file');
const fs = require('fs');
const glob = require("glob");
const path = require("path");

const treeModule = require("./transform_tree.js");
const treeBuilder = treeModule();

const argOpts = {string: ["path","analysisName"]}
const globOptions = {realpath: true};
const regex = /((<!--\s*#include\s+\w+\s*=\s*")(.+.asp)("\s*-->))/g;

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


async function analyzeStart(opts) {


    var resolvedPath = pathModule.resolve(opts.path);
    var analysisRoot = (resolvedPath + path.sep).toLowerCase();
    console.log("Analyzing: " + analysisRoot);
    var allFiles;
    var totalTree;
    
    try{
        //Do this


        var globFiles = await globAsync(pathArg + "/**/*.asp", globOptions)
        
        allFiles = globFiles.map(function(file) {return file.toLowerCase()});

        fs.writeFile("allFiles.json", JSON.stringify(allFiles, null, 2),()=>{}); 
        var fileStats = await Promise.all(allFiles.map(buildFileStats));
        // var fileStats = await Promise.all( allFiles.map(await buildFileStats));


        fs.writeFile("fileStats.json", JSON.stringify(fileStats, null, 2),()=>{});
        //Do that

        var totalStatsDict = convertArray(fileStats); 
        fs.writeFile("statsDict.json", JSON.stringify(totalStatsDict, null, 2),()=>{}); 

        totalTree = treeBuilder.buildDictTree(totalStatsDict); 
        fs.writeFileSync("tree.json", JSON.stringify(totalTree, null, 2),()=>{});
        
        var statsArr = analyzeModule.run({
            statsDict: totalStatsDict,
            tree: totalTree,
            analysisFilename: opts.analysisName
        });

        var flatTree = buildFlatTree(statsArr);
        fs.writeFile("distinctIncludes.json", JSON.stringify(flatTree, null, 2),()=>{}); 
    }catch(e){
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
}

analyzeStart(runOpts);
