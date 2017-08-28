const fs = require('fs');
const json2csv = require('json2csv');

const comparisonFilename = "compare.csv";
const beforeFilename = "before.json";
const afterFilename = "after.json";

var before = JSON.parse(fs.readFileSync(beforeFilename));
var after = JSON.parse(fs.readFileSync(afterFilename));

var fields = ["file", "includes_before", "includes_after", "total_loc_before", "total_loc_after"];
var comparison = [];

// fields = ["file", "num_includes", "loc", "total_loc"];

function findFileByName(arr, filename) {
    return arr.find(function(element) {
        return element.file === filename;
    });
}

function statsEqual(stats) {
    return (combined[fields[1]] == combined[fields[2]]) && (combined[fields[3]] == combined[fields[4]]);
}

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