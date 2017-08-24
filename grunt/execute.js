// Execute code inline or from an existing .js file
// Create version files for asp and c#
// 
module.exports = function (grunt, config) {
	//grunt.log.writeln(JSON.stringify(config.buildLocation));
    var fs = require('fs');
    const fsPath = require('path');
    var rimraf = require('rimraf');
    
    
	

    return {
		fileStats: {
		    call: function (grunt, options, async) {
		        grunt.log.writeln("Writing stats.");
		    }
		}
    }
};
