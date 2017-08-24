// Aliases - allows for easy configuration of tasks outside of the primary config file.
// https://github.com/firstandthird/load-grunt-config#aliases

module.exports = {
    "fileStats": {
        description: "Basic file statistics to {filename}.stats.json.",
        tasks: ["execute:fileStats"]
    }
};