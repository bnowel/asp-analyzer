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



const treeModule = require("../transform_tree.js")({});

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
console.log("TREE TESTS PASSING");