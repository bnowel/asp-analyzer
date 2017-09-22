// Utility functions to update all files that are top level (not include) files.
// This is used to massage the include files and move them around a bit more automatically.

const fs = require("fs");
const pathModule = require("path");
const prependFile = require("prepend-file");
const firstline = require("firstline");
const replaceInFile = require('replace-in-file');

// All files with no references to them.
var distinctPath = "C:\\Users\\bernie.nowel\\Desktop\\asp-analyze\\2017920-121826\\dev\\distinctIncludes.json";
var sourcePath = "C:\\iis\\wwwroot\\Applications\\Mindbody.Web.Clients\\";

var includeFilename = "inc_global_flat.asp";
var newIncludePath = pathModule.join(sourcePath, `web\\asp\\${includeFilename}`)
var distinctIncludes = require(distinctPath);

var endOfLine = require('os').EOL;
var count = 0;

// Give a relative path using forward slashes   
function relativeIncludePath(from, to) {
    return (pathModule.relative(pathModule.dirname(from), to)).replace(/\\/g, "/");
}

function includeLine(filename) {
    return `<!-- #include file=\"${filename}\" -->`;
}

console.log(`Adding ${includeFilename} to all top level files`);

var codePageLine = `<%@ CodePage=65001 %>${endOfLine}`;
var codePageRegex = /\s*<%@\s*codepage="?65001"?\s+%>/i;

// the magic happens here
async function doStuffPerFile(filename) {
    var fullPath = pathModule.join(sourcePath, filename);
    var relativePath = relativeIncludePath(fullPath, newIncludePath);
    var newIncludeLine = includeLine(relativePath)
    //console.log(filename, newIncludeLine);

    // check for <%@ CodePage=65001 %>
    var firstTextLine = await firstline(fullPath);
    var codePageIsFirstLine = codePageRegex.test(firstTextLine)
    if (codePageIsFirstLine) {
        var opts = { 
            files: fullPath,
            from: codePageRegex,
            to: codePageLine + newIncludeLine
        }
        var changes = replaceInFile.sync(opts);
        //console.log(`Modified: ${changes.join(', ')}`);
    }
    else {
        console.log(filename);
        // Add the end of line here special because above there is already an end of line
        prependFile.sync(fullPath, newIncludeLine  + endOfLine);
    }
}

for (var filename in distinctIncludes) {
    if (distinctIncludes.hasOwnProperty(filename)) {
        count++;
        
        doStuffPerFile(filename);
    } 
}

console.log(`${count} top level files`)