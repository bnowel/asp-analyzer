const fs = require('fs');
const json2csv = require('json2csv');
const parseArgs = require('minimist')
const argOpts = {string: ["path"]}

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

var beforeArg = argv.before;
if (!beforeArg) {
    console.error("--before is required");
    return;
}

var afterArg = argv.after;
if (!afterArg) {
    console.error("--after is required");
    return;
}

var outFileArg = argv.outFile;
var comparisonFilename = "compare.csv";

if (outFileArg) {
    comparisonFilename = outFileArg + ".csv";
}
else {
    console.log("--outFile not passed, using default: " + comparisonFilename)
}


const beforeFilename = beforeArg + ".json";
const afterFilename = afterArg + ".json";

var before = JSON.parse(fs.readFileSync(beforeFilename));
var after = JSON.parse(fs.readFileSync(afterFilename));

var fields = ["file", "includes_before", "includes_after", "total_loc_before", "total_loc_after"];
var comparison = [];

function findFileByName(arr, filename) {
    return arr.find(function(element) {
        return element.file === filename;
    });
}

function statsEqual(stats) {
    return (combined[fields[1]] == combined[fields[2]]) && (combined[fields[3]] == combined[fields[4]]);
}

// These are the fields from the analyze process in analyze.js
// fields = ["file", "num_includes", "loc", "total_loc"];

function combineStats(beforeFile, afterFile) {
    var combined = {};
    combined[fields[0]] = afterFile.file;
    combined[fields[1]] = beforeFile.num_includes;
    combined[fields[2]] = afterFile.num_includes;
    combined[fields[3]] = beforeFile.total_loc;
    combined[fields[4]] = afterFile.total_loc;

    return combined;
}

var diffFiles = 0;
var stats = [];

for (var i = 0; i < after.length; i++) {
    var afterFile = after[i];
    var beforeFile = findFileByName(before, afterFile.file);
    var combined = combineStats(beforeFile, afterFile);
    if (!statsEqual(combined)) {
        diffFiles++;
        stats.push(combined);
    }
}

console.log(diffFiles + " files changed");

var csv = json2csv({data: stats, fields: fields});
fs.writeFile(comparisonFilename, csv, function(err) {
    if (err)
        throw err;
    console.log(comparisonFilename + " saved.");
});