const fs = require("fs");
const json2csv = require("json2csv");

const defaultOpts = {
    showMissing : true
};

var compareModule = function(incomingOpts) {
    var moduleOpts = {};
    Object.assign(moduleOpts,defaultOpts,incomingOpts);

    var fields = ["file", "num_refs_before", "num_refs_after", "includes_before", "includes_after", "total_loc_before", "total_loc_after", "loc_delta", "loc_delta_%"];

    function findFileByName(arr, filename) {
        return arr.find(function(element) {
            return element.file === filename;
        });
    }

    function statsEqual(combined) {
        return (combined[fields[1]] == combined[fields[2]]) && (combined[fields[3]] == combined[fields[4]]) && (combined[fields[5]] == combined[fields[6]]);
    }

    // These are the fields from the analyze process in analyze.js
    // fields = ["file", "num_refs", "num_includes", "loc", "total_loc"];

    function combineStats(beforeFile, afterFile) {
        var combined = {};
        combined[fields[0]] = afterFile.file;
        combined[fields[1]] = beforeFile.num_refs;
        combined[fields[2]] = afterFile.num_refs;
        combined[fields[3]] = beforeFile.num_includes;
        combined[fields[4]] = afterFile.num_includes;
        combined[fields[5]] = beforeFile.total_loc;
        combined[fields[6]] = afterFile.total_loc;
        let delta = afterFile.total_loc - beforeFile.total_loc;
        combined[fields[7]] = delta;
        let percent = (Math.round(1000*delta/beforeFile.total_loc)/1000);
        combined[fields[8]] = percent;

        return combined;
    }

    function compareStats(opts) {
        var before = opts.before.statsArr;
        var after = opts.after.statsArr;
        var beforeIncludes = opts.before.distinctIncludes;
        var afterIncludes = opts.after.distinctIncludes;

        var comparisonFilename = opts.outFile;
        var missingIncludesFilename = opts.missingIncludes;

        var diffFiles = 0;
        var stats = [];

        for (let i = 0; i < after.length; i++) {
            let afterFile = after[i];
            let beforeFile = findFileByName(before, afterFile.file);
            let combined = combineStats(beforeFile, afterFile);
            if (!statsEqual(combined)) {
                diffFiles++;
                stats.push(combined);
            }
        }

        var csv = json2csv({data: stats, fields: fields});
        fs.writeFileSync(comparisonFilename, csv);
        console.log(comparisonFilename + " saved.");
        if (opts.summary){
            console.log(diffFiles + " files changed");
            var percentAvg = Math.round(100*(stats.map(x=>x[fields[8]]).reduce(function(sum, value) {
                return sum + value;
            }, 0)/stats.length));
            console.log("Avg % reduction per file: "+ percentAvg+"%");
        }

        var filesMissingIncludes = [];

        //compare distinct includes (for top level files only)
        for (var fileName in afterIncludes ){
            if (afterIncludes.hasOwnProperty(fileName)){
                let afterIncludesArray = afterIncludes[fileName];
                let beforeIncludesArray = beforeIncludes[fileName];
                if (beforeIncludesArray){
                    let missingIncludes =  beforeIncludesArray.filter((x)=> !afterIncludesArray.includes(x));
                    if (missingIncludes.length > 0){
                        filesMissingIncludes.push({file: fileName, missingIncludes: missingIncludes});
                    }                    
                }
            }
        }
        for (let i = 0; i < afterIncludes.length; i++) {
            let afterFile = after[i];
            let beforeFile = findFileByName(before, afterFile.file);
            let combined = combineStats(beforeFile, afterFile);
            if (!statsEqual(combined)) {
                diffFiles++;
                stats.push(combined);
            }
        }

        if(moduleOpts.showMissing){
            filesMissingIncludes.forEach(function(file) {
                let missing = file.missingIncludes.join("\n\t"); 
                console.warn("\n" + file.file + " is missing:");
                console.warn("\n\t" + missing);
            }, this);
        }
        
        console.log(missingIncludesFilename + " saved.");
        fs.writeFileSync(missingIncludesFilename, JSON.stringify(filesMissingIncludes, null, 2));


    }
    return {
        compareStats: compareStats
    };
};

module.exports = compareModule;