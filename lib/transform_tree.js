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
    function buildHierarchyDiagram(stats) {
        let hierarchyDiagram = '@startuml\n';
        for (var file in stats) {
            if (stats.hasOwnProperty(file)) {
                const path = file;
                const name = file.substring(file.lastIndexOf('\\') + 1).replace('-','_');
                const { loc: linesOfCode, inc: includes } = stats[file];
                const includesStr = includes.reduce((agg, include, i, a) => {
                    return agg + `${name} <-- ${include.substring(include.lastIndexOf('\\') + 1).replace('-','_')}` + ((i < a.length - 1) ?  '\n' : '');
                }, '');
                hierarchyDiagram += `
${includesStr}
object ${name} {
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

