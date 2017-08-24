module.exports = function (grunt) {

	var configs = {
        // Allowing for the build location to be specified gives control over wheter or not the files are local or "somewhere else".
		sourcePath : grunt.option('sourcePath') || '.'
	}


    // Instead of defining all of the tasks we automagically load them in with load-grunt-config.
    // This will handle loading all tasks from the grunt folder by default but can be passed arguements - documented at the repo below.
    // https://github.com/firstandthird/load-grunt-config
    require('load-grunt-config')(grunt, {
        config: configs,

        // Note: enabling jitGrunt (justInTime) means that task definitions will not get
        // loaded until they are needed. In configurations that do not have a ton of tasks
        // this appears to load slower; it is not - about 70% of the time in smaller configs the load is
        // roughly 500ms faster. The real gain comes when the config contains lots of tasks, say > 20,
        // and it only loads the tasks it needs. In these cases we are seconds faster, incrementing as
        // the config grows.
        jitGrunt: true
    });
};