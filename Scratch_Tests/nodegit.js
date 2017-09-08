// There is probably a way to get nodegit to work for this but it way to complicated for the simple
// git checkout features that I want.

const Git = require("nodegit");
const NodePath = require("path");

var passedPath = "\\iis\\wwwroot\\Applications\\Mindbody.Web.Clients";

var pathToRepo = NodePath.resolve(passedPath);
console.log(pathToRepo);

//var branch = "dev";
var branch = "9d9e12dd8545e7184e2fa4170e8ad11c9e0f03da";

Git.Repository.open(pathToRepo).then(function (repo) {
    repo.getBranch(branch).then(function(reference) {
        return repo.checkoutRef(reference);
    }).catch(function(err) {
        // Failed to check out a git branch
        console.log("Didn't find a branch '" + branch + "'");
        
        // Try it as a direct reference
        repo.getCommit(branch).then(function(commit) {
            //console.log("Setting head in a detached state to commit " + commit.id());
            console.log("checkoutRef " + commit.id());
            
            repo.setHeadDetached(commit.id());
        }).catch(function(err) {
            console.log("didn't find hash " + branch);
            console.log(err.message);
        });
    });
}).catch(function(err) {
    // Failed to open the git repository
    console.log(err.message);
});