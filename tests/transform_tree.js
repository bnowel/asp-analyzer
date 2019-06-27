//scr-scr-scratch!!!




const sampleStatsDict = {
    "adm/a1.asp": {loc:12, inc:["inc1.asp", "inc2.asp", "adm/inc3.asp"]},
    "inc1.asp": {loc:12, inc:["adm/inc3.asp"]},
    "inc2.asp": {loc:12, inc:[]},
    "adm/inc3.asp": {loc:12, inc:[]},
};

const expectedDictTree = 
    {
        "adm/inc3.asp": {},
        "inc1.asp":
        {
            "adm/inc3.asp": {}
        },
        "inc2.asp": {},
        "adm/a1.asp":
        {
            "inc1.asp":
                {
                    "adm/inc3.asp": {}
                },
            "inc2.asp": {},
            "adm/inc3.asp": {}
        }
    };

    const expectedHierarchyDiagram = 
`@startuml

a1.asp <-- inc1.asp
a1.asp <-- inc2.asp
a1.asp <-- inc3.asp
object a1.asp {
    path: adm/a1.asp
    lines: 12
}

inc1.asp <-- inc3.asp
object inc1.asp {
    path: inc1.asp
    lines: 12
}


object inc2.asp {
    path: inc2.asp
    lines: 12
}


object inc3.asp {
    path: adm/inc3.asp
    lines: 12
}

@enduml`;

const treeModule = require("../lib/transform_tree.js")({});

var actualTree = treeModule.buildDictTree(sampleStatsDict);

//buildTree(sampleStats1)
var expectedString = JSON.stringify(expectedDictTree);
var actualString = JSON.stringify(actualTree);
//console.log(expectedString)
//console.log(actualString)
console.assert(expectedString == actualString);
var expectedFlatTree = {"adm/inc3.asp":[],"inc1.asp":["adm/inc3.asp"],"inc2.asp":[],"adm/a1.asp":["adm/inc3.asp","inc1.asp","inc2.asp"]};
var expectedFlatTreeString = JSON.stringify(expectedFlatTree);
var actualFlatTreeString = JSON.stringify(treeModule.flattenTree(actualTree));
console.assert(expectedFlatTreeString == actualFlatTreeString);
console.assert(expectedHierarchyDiagram === treeModule.buildHierarchyDiagram(sampleStatsDict));
console.log("TREE TESTS PASSING");