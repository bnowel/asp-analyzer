const defaultOpts = {
    globOptions: { realpath: true },
    regex: /((<!--\s*#include\s+\w+\s*=\s*")(.+.asp)("\s*-->))/g,
    defaultOutputPath: "."
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

var analyzeModule = function(incomingOpts) {
    var moduleOpts = {};
    Object.assign(moduleOpts, defaultOpts, incomingOpts);
    var moduleLogger = moduleOpts.logger || console;
    var logger = moduleLogger;

    function analyzeStats(opts) {
        var outputPath = opts.outputPath || moduleOpts.defaultOutputPath;
        logger = opts.logger || moduleLogger;

        function getOutputPath(filename) {
            return pathModule.join(outputPath, filename);
        }

        const analysisJsonFilename = getOutputPath("analysis.json");
        const analysisFilename = getOutputPath("analysis.csv");

        //We should leave this up to the caller
        // var statsDict = opts.statsDict || JSON.parse(fs.readFileSync(getOutputPath("statsDict.json")));
        // var tree = opts.tree || JSON.parse(fs.readFileSync(getOutputPath("tree.json")));        

        var statsDict = opts.statsDict;
        var tree = opts.tree;
        var openCsv = opts.openCsv;

        function getLinesOfCode(file, fileTree) {
            var locInIncludes = 0;

            for (var subFile in fileTree) {
                if (tree.hasOwnProperty(subFile)) {
                    locInIncludes += getLinesOfCode(subFile, fileTree[subFile]);
                }
            }
            return statsDict[file].loc + locInIncludes;

        }

        var fields = ["file", "num_refs", "num_includes", "loc", "total_loc", "optimal_loc", "optimal_loc_delta", "bloat_factor"];
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

        for (let i = 0; i < stats.length; i++) {
            let stat = stats[i];

            stat[fields[1]] = allRefs[stat[fields[0]]];
        }


        var flatTree = buildFlatTree(stats, tree, treeModule());

        for (let index in stats) {
            let fileObject = stats[index];
            if (flatTree.hasOwnProperty(fileObject.file)) {
                let includes = flatTree[fileObject.file];
                //sum includes
                var optimal = includes.reduce(function(sum, includedFile) {
                    return sum + statsDict[includedFile].loc;
                }, 0);
                optimal += fileObject[fields[3]];
                fileObject[fields[5]] = optimal;
                fileObject[fields[6]] = fileObject[fields[4]] - optimal;
                if (fileObject[fields[5]] != 0) {
                    fileObject[fields[7]] = (Math.round((fileObject[fields[4]] * 100) / fileObject[fields[5]]) / 100);
                } else {
                    fileObject[fields[7]] = 1;
                }

            }
        }


        var csv = json2csv({ data: stats, fields: fields });
        fs.writeFileSync(analysisJsonFilename, JSON.stringify(stats, null, 2));
        logger.log(analysisJsonFilename + " saved.");


        fs.writeFileSync(analysisFilename, csv);
        logger.log(analysisFilename + " saved.");

        if (openCsv) {
            var platform = os.platform();

            if (platform == "win32") {
                require("child_process").exec("start \"\" \"" + analysisFilename + "\"");
            } else if (platform == "darwin") {
                require("child_process").exec("open \"\" \"" + analysisFilename + "\"");
            } else {
                logger.log("Open the csv file for " + platform + " not implemented.");
            }
        }

        return { statsArr: stats, flatTree: flatTree };
    }
    // Truncate the branch because it could be a SHA which would be HUGE
    function getBranchPath(outputPath, branch) {
        return pathModule.join(outputPath, branch.substring(0, 12));
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

    async function analyzeFiles(opts) {
        const treeBuilder = treeModule();
        var resolvedPath = pathModule.resolve(opts.path);
        var analysisRoot = (resolvedPath + pathModule.sep).toLowerCase();
        var outputPath = opts.outputPath || ".";
        var analysisFilename = opts.analysisName || "analysis";

        if (opts.summary) {
            logger.log("Analyzing: " + analysisRoot);
        }
        var allFiles;
        var totalTree;

        try {
            var globFiles = await globAsync(opts.path + "/**/*.asp", moduleOpts.globOptions);

            allFiles = globFiles.map(function(file) { return file.toLowerCase(); });

            var fileStats = await Promise.all(allFiles.map(buildFileStats));
            var allWarnings = getWarningsFromStats(fileStats);


            var totalStatsDict = convertArray(fileStats);
            totalTree = treeBuilder.buildDictTree(totalStatsDict);

            var statsObj = analyzeStats({
                statsDict: totalStatsDict,
                tree: totalTree,
                analysisFilename: analysisFilename.substring(0, 12),
                outputPath: outputPath,
                openCsv: opts.openCsv
            });


            await Promise.all([
                // TODO: What is actually contained in each of these files in the README
                writeJsonAsync("allFiles.json", allFiles),
                writeJsonAsync("fileStats.json", fileStats),
                writeJsonAsync("statsDict.json", totalStatsDict),
                writeJsonAsync("tree.json", totalTree),
                writeJsonAsync("distinctIncludes.json", statsObj.flatTree),
                writeTextFileAsync("warnings.txt", allWarnings),
                writeTextFileAsync("hierarchyDiagram.txt", treeBuilder.buildHierarchyDiagram(totalStatsDict)),
            ]);

            if (opts.warnings) {
                console.warn(allWarnings);
            }

            return {
                statsArr: statsObj.statsArr,
                distinctIncludes: statsObj.flatTree,
                warnings: allWarnings
            };
        } catch (e) {
            logger.log(e);
        }

        function buildFileStats(file) {

            return new Promise(function(resolve, reject) {
                clifAsync(file).then((num) => {

                    fs.readFile(file, function(err, data) {
                        parseFile(file, analysisRoot, moduleOpts, data, allFiles, opts, resolve, num);
                    });
                }).catch(reject);
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
            obj[elem.name] = { inc: elem.inc, loc: elem.loc };
        }


        function globAsync(pattern, options) {
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
                    if (err !== null) return reject(err);
                    resolve(number);
                });
            });
        }

        function writeJsonAsync(filename, json, callback) {
            return writeTextFileAsync(filename, JSON.stringify(json, null, 2), callback);
        }

        function writeTextFileAsync(filename, text, callback) {
            return new Promise(function(resolve, reject) {
                var relativeFilename = pathModule.join(outputPath, filename);

                fs.writeFile(relativeFilename, text, (err) => {
                    if (callback)
                        callback(err);

                    if (err)
                        reject(err);
                    else
                        resolve();
                });
            });
        }
    }

    async function startAnalyze(analysisOpts) {
        var outputDir = analysisOpts.output;
        var pathArg = analysisOpts.dir;

        if (outputDir && !fs.existsSync(outputDir)) {
            logger.log("Creating output directory " + outputDir);
            mkdirp(outputDir);
        }

        logger.log("Analyzing: " + pathArg);

        var opts = {
            path: pathArg,
            outputPath: outputDir,
            analysisName: analysisOpts.analysisName,
            summary: analysisOpts.summary,
            warnings: analysisOpts.warnings,
            openCsv: analysisOpts.openCsv
        };

        var analysisStats = await analyzeFiles(opts);
        if (analysisOpts.kpi) {
            startKpiAnalyze(analysisStats);
        }
        return analysisStats;
    }

    async function startKpiAnalyze(analysis) {
        //var analysis = await startAnalyze(analysisOpts);
        // Generate some kpis

        var bloatCount = 0;
        var total_loc = 0;
        var bloatSum = 0;

        for (var i = 0; i < analysis.statsArr.length; i++) {
            var stat = analysis.statsArr[i];

            total_loc += stat.total_loc;

            if (stat.bloat_factor) {
                bloatCount++;
                bloatSum += stat.bloat_factor;
            }
        }

        var bloatAvg = bloatSum / bloatCount;

        // don't use the logger here since we want to always display this when showing kpis
        // also, don't log from here, because we might simply be invoked by js
        analysis.kpis = {
            bloat_avg: bloatAvg,
            total_loc: total_loc
        };
    }

    async function startCompare(compareOpts) {
        var outputDir = compareOpts.output;
        var beforeArg = compareOpts.before;
        var afterArg = compareOpts.after;
        var pathArg = compareOpts.dir;

        if (!fs.existsSync(outputDir)) {
            logger.log("Creating output directory " + outputDir);
            mkdirp(outputDir);
        }

        var repo = Git(pathArg);
        var beforePath = getBranchPath(outputDir, beforeArg);
        var afterPath = getBranchPath(outputDir, afterArg);

        mkdirp(beforePath);
        mkdirp(afterPath);

        logger.log("Analyzing: " + pathArg);

        await repo.checkout(beforeArg);
        logger.log("git checkout " + beforeArg);

        var runBeforeOpts = {
            path: pathArg,
            outputPath: beforePath,
            analysisName: beforeArg,
            summary: false,
            warnings: false
        };
        var beforeStats = await analyzeFiles(runBeforeOpts);

        await repo.checkout(afterArg);
        logger.log("git checkout " + afterArg);

        var runAfterOpts = {
            path: pathArg,
            outputPath: afterPath,
            analysisName: afterArg,
            summary: false,
            warnings: false
        };
        var afterStats = await analyzeFiles(runAfterOpts);

        compareModule.compareStats({
            before: beforeStats,
            after: afterStats,
            outFile: pathModule.join(outputDir, "compare.csv"),
            summary: compareOpts.summary,
            warnings: compareOpts.warnings,
            openCsv: compareOpts.openCsv
        });
    }

    return {
        analyzeStats: analyzeStats,
        startAnalyze: startAnalyze,
        startCompare: startCompare,
        startKpiAnalyze: startKpiAnalyze,
        parseFile: parseFile
    };
};

module.exports = analyzeModule;

function parseFile(file, analysisRoot, moduleOpts, data, allFiles, opts, resolve, num) {
    let m;
    let includes = [];
    let warnings = [];
    let dirname = pathModule.dirname(file);
    let filename = file.replace(analysisRoot, "");
    while ((m = moduleOpts.regex.exec(data)) !== null) {
        let match = m[3];
        let fullIncFile = match.startsWith("/") ? pathModule.resolve(analysisRoot, match.substring(1)) : pathModule.resolve(dirname, match);
        let incFile = fullIncFile.toLowerCase().replace(analysisRoot, "");
        // Make sure that the reference we resolve exists on the filesystem
        var fileExists = allFiles.find(x => x == fullIncFile.toLowerCase());
        if (fileExists) {
            // Add only valid includes
            includes.push(incFile);
        } else {
            var warning = "Can't find: " + fullIncFile;
            warnings.push(warning);
        }
    }
    resolve({ name: filename, loc: num, inc: includes, warnings: warnings });
}

function buildFlatTree(statsArray, totalTree, treeBuilder) {
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