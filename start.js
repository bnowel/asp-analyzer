
var path = "C:/Users/clint.parker/Source/Repos/Mindbody.Web.Clients/Web/ASP";
const clif = require('count-lines-in-file');
const fs = require('fs');

var glob = require("glob")
var options = {};



globAsync(path+"/**/*.asp", options)
    .catch(console.log)
    .then((files)=>Promise.all(files.map(buildFileStats)))
    .then((data)=>{jsonStats = data; return data;})

    
    .then((data)=>console.log(data));


function buildFileStats(file)
{
    return new Promise(function(resolve,reject){
        clifAsync(file).then((num) => resolve({name:file,loc:num}))
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