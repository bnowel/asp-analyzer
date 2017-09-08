const Git = require("simple-git");
const NodePath = require("path");

var passedPath = "\\iis\\wwwroot\\Applications\\Mindbody.Web.Clients";

var pathToRepo = NodePath.resolve(passedPath);
console.log(pathToRepo);

var branch1 = "dev";
var branch2 = "json2cleanup";
//var branch = "9d9e12dd8545e7184e2fa4170e8ad11c9e0f03da";

function resolveAfter2Seconds(x) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(x);
        }, 10000);
    });
}

async function test() {
    await resolveAfter2Seconds(5);
}

Git(pathToRepo).checkout(branch1).then(()=> {
    console.log("git checkout " + branch1);
    test().then((param) => {
        Git(pathToRepo).checkout(branch2).then(()=> {
            console.log("git checkout " + branch2);
            test();
        });
    });

    
});

