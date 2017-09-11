const nodeOs = require("os");
const nodePath = require("path");
const defaultOutput = "Desktop/asp-analyze";
const commanderModule = require("commander");



function getOpts(){
    


    var argArray = process.argv;
    return buildOpts(argArray,{});
}


function getDateTimeForPath() {
    var now = new Date();
    
    return now.getFullYear() + "" + (now.getMonth() + 1) + "" + now.getDate() + "-" + now.getHours() + "" + now.getMinutes() + "" + now.getSeconds();
}


function buildOpts(argv, argOpts){
    var opts = {};
    Object.assign(opts,argOpts);
    var parsedArgs = commanderModule
        .version("1.0.0")
        .option("-p,--dir,--path <path>", "--path <path>",".")
        .option("-n,--analysisName <name>", "--analysisName <name>","ASP-Analysis")
        .option("-b,--before <name>","--before [name] ")
        .option("-a, --after <name>","--after [name] ")
        .option("-o, --output <path>"," output directory",defaultOutput)
        .option("-s, --summary"," show summary", true)
        .option("-ws, --warnings"," show warnings", false)
        .parse(process.argv);
    
    

    var pathArg = parsedArgs.path || parsedArgs.dir;

    parsedArgs.path = pathArg;
    parsedArgs.dir = pathArg;


    var args = {};
    Object.assign(args,parsedArgs);
    if (!pathArg) {
        console.error("--path is required");
        return;
    }
    
    var beforeArg = args.before;
    var afterArg = args.after;
    var hasBeforeAndAfterArgs = false;
    
    
            
    // These are git references (branch or SHA)
    if ((!afterArg && !!beforeArg) || (!!afterArg && !beforeArg)) {
        console.error("Must pass --before and --after");
        return;
    } else {
        if (beforeArg && afterArg){
            hasBeforeAndAfterArgs = true;        
        }
    }
    
    var analysisNameArg = args.analysisName;
    if (!analysisNameArg && !hasBeforeAndAfterArgs) {
        console.error("--analysisName is required");
        return;
    }
    
    
    var outputArg = args.output;
    if (outputArg == defaultOutput){
        outputArg = nodePath.join(nodeOs.homedir(),outputArg);
    }
    var outputDir = nodePath.join(outputArg, getDateTimeForPath());
    
    var outputOpts = {
        dir:pathArg,
        analysisName:analysisNameArg,
        before:beforeArg,
        after:afterArg,
        compare:hasBeforeAndAfterArgs,
        output:outputDir,
        summary:argv.summary,
        warnings:argv.warnings
    };
    
    
        //console.log(outputOpts)
    return outputOpts;
}


module.exports = {
    getOpts : getOpts,
    buildOpts : buildOpts
};
