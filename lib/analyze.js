const defaultOpts = {
    globOptions : {realpath: true},
    regex : /((<!--\s*#include\s+\w+\s*=\s*")(.+.asp)("\s*-->))/g,
    defaultOutputPath:"."
};

const fs = require("fs");
const pathModule = require("path");
const json2csv = require("json2csv");
const mkdirp = require("mkdirp");
const compareModule = require("./compare.js")({});
const Git = require("simple-git");
const clif = require("count-lines-in-file");
const glob = require("glob");
const treeModule = require("./transform_tree.js");
const os = require("os");

const treeBuilder = treeModule();
var analyzeModule = function(incomingOpts) {
    var moduleOpts = {};
    Object.assign(moduleOpts, defaultOpts, incomingOpts);

    function buildStatsObj( fileStats) {
        var statsObj = {};
        statsObj.allWarnings = getWarningsFromStats(fileStats);
        statsObj.totalStatsDict = convertArray(fileStats);
        statsObj.totalTree = treeBuilder.buildDictTree(statsObj.totalStatsDict);
        statsObj.analysisObj = analyzeStats({
            statsDict: statsObj.totalStatsDict,
            tree: statsObj.totalTree
        });
        statsObj.flatTree = buildFlatTree(statsObj.analysisObj.data, statsObj.totalTree);
        return statsObj;
    }
    function analyzeStats(opts) {
    
        
        var statsDict = opts.statsDict;
        var tree = opts.tree;

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
                allRefs[file]++;
        }

        for (var file in tree) {
            if (tree.hasOwnProperty(file)) {
                let stat = {};
                stat[fields[0]] = file;
                stat[fields[2]] = statsDict[file].inc.length;
                stat[fields[3]] = statsDict[file].loc;
                stat[fields[4]] = getLinesOfCode(file, tree[file]);
                
                updateRefCounts(file, tree[file]);

                stats.push(stat);
            }
        }

        for (var i = 0; i < stats.length; i++) {
            let stat = stats[i];
            
            stat[fields[1]] = allRefs[stat[fields[0]]];
        }
        
        var analysisObj = {data: stats, fields: fields};
        

        return analysisObj;
    }

    async function buildAndWriteStats(fileStats,outputPath,allFiles){
        var statsObj = buildStatsObj(fileStats);
        await writeFiles(statsObj, outputPath, allFiles, fileStats);
        return statsObj;
    }
    

    async function analyzeFiles(opts) {
        var resolvedPath = pathModule.resolve(opts.path);
        var analysisRoot = (resolvedPath + pathModule.sep).toLowerCase();
        var outputPath = opts.outputPath || ".";

        if (opts.summary){
            console.log("Analyzing: " + analysisRoot);
        }
        var allFiles;
        
        try {
            var globFiles = await globAsync(opts.path + "/**/*.asp", moduleOpts.globOptions);
            
            allFiles = globFiles.map(function(file) {return file.toLowerCase();});
            
            var fileStats = await Promise.all(allFiles.map(buildFileStats));
            var statsObj = await buildAndWriteStats(fileStats,outputPath,allFiles);

            //TODO: is this necessary?
            console.log(getOutputPath(outputPath , "/analysis.json" )+ " saved.");
            console.log(getOutputPath(outputPath , "/analysis.csv" )+ " saved.");
            
            if (opts.warnings){
                console.warn(statsObj.allWarnings);
            }

            return {
                statsArr:statsObj.analysisObj.data,
                distinctIncludes:statsObj.flatTree
            };
        } catch(e) {
            console.log(e);
        }

        
        function buildFileStats(file) {
        
            return new Promise(function(resolve, reject){
                clifAsync(file).then((num) => {
        
                    fs.readFile(file, function(err, data){
                        parseFile(file, analysisRoot, moduleOpts, data, allFiles, opts, resolve, num);
                    });
                }).catch(reject);
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

    async function startScan(analysisOpts)  {
        var outputDir = analysisOpts.output;
        var pathArg = analysisOpts.dir;
        
        if (!fs.existsSync(outputDir)) {
            console.log("Creating output directory " + outputDir);
            mkdirp(outputDir);
        }
        
        console.log("Analyzing: " + pathArg);

        var opts = {
            path: pathArg,
            outputPath: outputDir,
            analysisName: analysisOpts.analysisName,
            summary : analysisOpts.summary,
            warnings: analysisOpts.warnings
        };
    
        await analyzeFiles(opts);
    }

    async function startCompare(compareOpts)  {
        var outputDir = compareOpts.output;
        var beforeArg = compareOpts.before;
        var afterArg = compareOpts.after;
        var pathArg = compareOpts.dir;
        
        if (!fs.existsSync(outputDir)) {
            console.log("Creating output directory " + outputDir);
            mkdirp(outputDir);
        }
        
        var repo = Git(pathArg);
        var beforePath = getBranchPath(outputDir, beforeArg);
        var afterPath = getBranchPath(outputDir, afterArg);

        mkdirp(beforePath);
        mkdirp(afterPath);

        console.log("Analyzing: " + pathArg);

        await repo.checkout(beforeArg);
        console.log("git checkout " + beforeArg);

        var runBeforeOpts = {
            path: pathArg,
            outputPath: beforePath,
            analysisName: beforeArg,
            summary:false,
            warnings: false
        };
        var beforeStats = await analyzeFiles(runBeforeOpts);

        await repo.checkout(afterArg);
        console.log("git checkout " + afterArg);

        var runAfterOpts = {
            path: pathArg,
            outputPath: afterPath,
            analysisName: afterArg,
            summary:false,
            warnings: false
        };
        var afterStats = await analyzeFiles(runAfterOpts);

        compareModule.compareStats({
            before: beforeStats,
            after: afterStats,
            outFile: pathModule.join(outputDir, "compare.csv"),
            summary:compareOpts.summary,
            warnings: compareOpts.warnings
        });
    }

    return {
        analyzeStats: analyzeStats,
        startScan: startScan,
        startCompare: startCompare,
        parseFile:parseFile,
        buildAndWriteStats:buildAndWriteStats
    };
};

module.exports = analyzeModule;

function parseFile(file, analysisRoot, moduleOpts, data, allFiles, opts, resolve, num) {
    let m;
    let includes = [];
    let warnings = [];
    let dirname = pathModule.dirname(file);
    let filename = file.replace(analysisRoot, "");
    while((m = moduleOpts.regex.exec(data)) !== null) {
        let match = m[3];
        let fullIncFile = match.startsWith("/")?pathModule.resolve(analysisRoot, match.substring(1)): pathModule.resolve(dirname, match);
        let incFile = fullIncFile.toLowerCase().replace(analysisRoot, "");
        // Make sure that the reference we resolve exists on the filesystem
        var fileExists = allFiles.find(x => x == fullIncFile.toLowerCase());
        if(fileExists) {
            // Add only valid includes
            includes.push(incFile);
        }
        else {
            var warning = "Can't find: " + fullIncFile;
            warnings.push(warning);
        }
    }
    resolve({ name: filename, loc: num, inc: includes, warnings: warnings });
}



function buildFlatTree(statsArray,totalTree){
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

    return treeBuilder.flattenTree(topLevelTree);
}

function getWarningsFromStats(stats) {
    var warnings = [];
    var endOfLine = os.EOL;
    var lbTab = endOfLine + "\t";

    for (var i = 0; i < stats.length; i++) {
        var stat = stats[i];
        
        if (stat.warnings.length > 0) {
            warnings.push(stat.name + lbTab + stat.warnings.join(lbTab));
        }
    }

    return warnings.join(endOfLine);
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

// Truncate the branch because it could be a SHA which would be HUGE
function getBranchPath(outputPath, branch) {
    return pathModule.join(outputPath, branch.substring(0, 12));
}

function getOutputPath(filename,outputPath) {
    return pathModule.join(outputPath, filename);
}

function globAsync(pattern, options){
    return new Promise(function(resolve, reject) {
        glob(pattern, options, function(err, files) {
            if (err !== null) return reject(err);
            resolve(files);
        });
    });
}
function writeTextFileAsync(outputPath, filename, text, callback) {
    return new Promise(function(resolve, reject) {
        var relativeFilename = pathModule.join(outputPath, filename);
        fs.writeFile(relativeFilename, text, (err) => {
            if(callback)
                callback(err);
            if(err)
                reject(err);
            else
                resolve();
        });
    });
}

function writeJsonAsync(outputPath,filename, json, callback) {
    return writeTextFileAsync(outputPath,filename, JSON.stringify(json, null, 2), callback);
}
async function writeFiles(statsObj, outputPath, allFiles, fileStats) {
    var csv = json2csv(statsObj.analysisObj);
    await Promise.all([
    // TODO: What is actually contained in each of these files in the README
        writeJsonAsync(outputPath, "allFiles.json", allFiles),
        writeJsonAsync(outputPath, "fileStats.json", fileStats),
        writeJsonAsync(outputPath, "statsDict.json", statsObj.totalStatsDict),
        writeJsonAsync(outputPath, "tree.json", statsObj.totalTree),
        writeJsonAsync(outputPath, "distinctIncludes.json", statsObj.flatTree),
        writeTextFileAsync(outputPath, "warnings.txt", statsObj.allWarnings),
        writeJsonAsync(outputPath, "analysis.json", statsObj.analysisObj.data),
        writeTextFileAsync(outputPath, "analysis.csv", csv)
    ]);
}
