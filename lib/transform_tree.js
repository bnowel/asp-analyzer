const defaultOpts = {};

var treeModule = function(incomingOpts) {
    var moduleOpts = {};
    Object.assign(moduleOpts,defaultOpts,incomingOpts);
    var treeCache = {};
        
    var statsDict = {};

        
    function buildDictTree(stats) {
        statsDict = stats;
            
        for (var file in stats) {
            if (stats.hasOwnProperty(file)) {
                buildIndividualTree(file, stats[file].inc);
            }
        }

        return treeCache;
    }

    // Assembles a tree hierarchy into a plantuml diagram to show the visual layout
    const SanitizeFileName = (fileName) => fileName
        .substring(fileName.lastIndexOf('\\') + 1)  // Remove any directory symbols for object titles, and use this only in the path
        .replace('-','_')                           // Remove any dashes which will cause plantuml to error because that isn't supported in object titles
        .replace('.asp','');                        // Remove any ".asp" file endings for object titles to avoid treating them as namespaces

    function buildHierarchyDiagram(stats) {
        let hierarchyDiagram = '@startuml\n\nleft to right direction\n\n';
        for (var file in stats) {
            if (stats.hasOwnProperty(file)) {
                const path = file;
                const sanitizedFilename = SanitizeFileName(file);
                const { loc: linesOfCode, inc: includedFiles } = stats[file];
                const includesStr = includedFiles.reduce((agg, includedFilename, i, a) => {
                    const sanitizedIncludedFilename = SanitizeFileName(includedFilename);
                    const optionalLineBreak = ((i < a.length - 1) ?  '\n' : '');
                    return agg + `${sanitizedFilename} <-- ${sanitizedIncludedFilename}${optionalLineBreak}`;
                }, '');
                hierarchyDiagram += `
${includesStr}
object ${sanitizedFilename} {
    path: ${path}
    lines: ${linesOfCode}
}`;
            }
            hierarchyDiagram += '\n';
        }
        hierarchyDiagram += '\n@enduml';
        return hierarchyDiagram;
    }

    function buildIndividualTree(file, incArray)
    {
        if (treeCache.hasOwnProperty(file)) {
            //TODO: Bump the refcount
            //console.log(file + ": ", treeCache[file]);
            return treeCache[file];
        }

        var obj = {};

        for (var i=0; i < incArray.length; i++) {
            var key = incArray[i];

            obj[key] = buildIndividualTree(key, statsDict[key].inc);
        }

        treeCache[file] = obj;

        return obj;
    }

    function flattenTree(tree)
    {
        var flatTree = {};
        for (var node in tree) {
            if (tree.hasOwnProperty(node)) {
                flatTree[node] = getDistinctIncludes(tree[node]);
            }
        }
        return flatTree;
    }

    function getDistinctIncludes(treeNode)
    {
        var flatObjNode = {};
        var flatArray = [];
        flatten(treeNode, flatObjNode);
        for (var fname in flatObjNode)
        {
            if (flatObjNode.hasOwnProperty(fname))
            {
                flatArray.push(fname);
            }
        }
        flatArray.sort();
        return flatArray;
    }

    function flatten(obj, node)
    {
        for (var prop in obj)
        {
            if (obj.hasOwnProperty(prop))
            {
                node[prop] = {};
                flatten(obj[prop], node);
            }
        }
    }

    
    return {
        //buildTree: buildTree,
        buildDictTree: buildDictTree,
        flattenTree : flattenTree,
        buildHierarchyDiagram: buildHierarchyDiagram,
    };
};




module.exports = treeModule;

