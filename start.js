const parseArgs = require('minimist')
const pathModule = require('path');
const clif = require('count-lines-in-file');
const fs = require('fs');
const glob = require("glob")
const treeBuilder = require("./transform_tree.js")


const argOpts = {string:["path"]}
const globOptions = {realpath:true};
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

var path = argv.path;
if (!path){
    console.error("--path is required");
    return;
}

var resolvedPath = pathModule.resolve(path);
var analysisRoot = resolvedPath + "/";
console.log("Analyzing :" + analysisRoot);

globAsync(path+"/**/*.asp", globOptions)
    .catch(console.log)
    .then((files)=>Promise.all(files.map(buildFileStats)))
    .then((data)=>{jsonStats = data; return data;})
    .then((data)=>{return treeBuilder.buildTree(data)})
    .then((data)=> console.log(JSON.stringify(data,null,2)));


function buildFileStats(file)
{
    return new Promise(function(resolve,reject){
        clifAsync(file).then((num) => {
            fs.readFile(file,function(err,data){
                let m;
                let includes = [];
                let dirname = pathModule.dirname(file)
                let filename = file.replace(analysisRoot,"")
                if ((m = regex.exec(data)) !== null) {
                    m.forEach((match, groupIndex) => {
                        if (groupIndex === 3){
                            let incFile = pathModule.resolve(dirname,match).replace(analysisRoot,"")
                            includes.push(incFile)
                        }
                    });
                }
                resolve({name:filename,loc:num,inc:includes})
            });
        });
    });
}



function globAsync(pattern, options){
    return new Promise(function(resolve,reject){
        glob(pattern, options, function(err, files){
             if(err !== null) return reject(err);
             resolve(files);
        });
    });
}


function clifAsync(file){
    return new Promise(function(resolve,reject){
         clif(file,function(err,number){
             if(err !== null) return reject(err);
             resolve(number);
         });
    });
}