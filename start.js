const parseArgs = require('minimist')
const pathModule = require('path');
const clif = require('count-lines-in-file');
const fs = require('fs');
const glob = require("glob");
const treeBuilder = require("./transform_tree.js");
const path = require("path");

const argOpts = {string: ["path"]}
const globOptions = {realpath: true};
const regex = /((<!--\s*#include\s+\w+\s*=\s*")(.+.asp)("\s*-->))/;

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

var resolvedPath = pathModule.resolve(pathArg);
var analysisRoot = resolvedPath + path.sep;
console.log("Analyzing: " + analysisRoot);

// Make sure to use forward slashes in glob expressions (Even on Windows). https://github.com/isaacs/node-glob 
globAsync(pathArg + "/**/*.asp", globOptions)
    .catch(console.log)
    // Write to a json file for testing
    .then((files) => {fs.writeFileSync("allFiles.json", JSON.stringify(files, null, 2)); return files; })
    .then((files)=>Promise.all(files.map(buildFileStats)))
    .then((data)=>{return convertArray(data);})

    .then((data)=>{jsonStats = data; return data;})
    .then((data)=>{return treeBuilder.buildDictTree(data)})
    .then((data)=> console.log(JSON.stringify(data, null, 2)));


function buildFileStats(file) {

    return new Promise(function(resolve, reject){
        clifAsync(file).then((num) => {
            fs.readFile(file, function(err, data){
                let m;
                let includes = [];
                let dirname = pathModule.dirname(file)
                let filename = file.replace(analysisRoot, "")
                if ((m = regex.exec(data)) !== null) {
                    m.forEach((match, groupIndex) => {
                        if (groupIndex === 3) {
                            let incFile = pathModule.resolve(dirname, match).replace(analysisRoot, "")
                            includes.push(incFile)
                        }
                    });
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