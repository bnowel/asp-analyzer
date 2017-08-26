const fs = require('fs');

var statsDict = JSON.parse(fs.readFileSync("statsDict.json"));
var tree = JSON.parse(fs.readFileSync("tree.json"));

function getLinesOfCode(file, fileTree) {
    var locInIncludes = 0;

    for (var subFile in fileTree) {
        if (tree.hasOwnProperty(subFile)) {
            locInIncludes += getLinesOfCode(subFile, fileTree[subFile]);
        }
    }
    return statsDict[file].loc + locInIncludes;

}

console.log("filename,num_includes,loc,total_loc")
for (var file in tree) {
    if (tree.hasOwnProperty(file)) {
        console.log(file + "," + statsDict[file].inc.length +"," + statsDict[file].loc + "," + getLinesOfCode(file, tree[file]));
    }
}
