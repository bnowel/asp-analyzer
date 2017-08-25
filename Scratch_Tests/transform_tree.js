//scr-scr-scratch!!!

var sampleStats1 = [
    {name:"adm/a1.asp", loc:12, inc:["inc1.asp", "inc2.asp", "adm/inc3.asp"]},
    {name:"inc1.asp", loc:12, inc:["adm/inc3.asp"]},
    {name:"inc2.asp", loc:12, inc:[]},
    {name:"adm/inc3.asp", loc:12, inc:[]},

];

var expectedTree = [
    {
        name:"adm/a1.asp",
        inc:[
            {
                name : "inc1.asp",
                inc:[
                    {
                        name : "adm/inc3.asp",
                        inc:[]
                    }
                ]
            },
            {
                name : "inc2.asp",
                inc:[]
            },
            {
                name : "adm/inc3.asp",
                inc:[]
            }
        ]
    },
    {
        name : "inc1.asp",
        inc:[
            {
                name : "adm/inc3.asp",
                inc:[]
            }
        ]
    },
    {
        name : "inc2.asp",
        inc:[]
    },
    {
        name : "adm/inc3.asp",
        inc:[]
    }
];


var treeModule = require("../transform_tree.js");

var actualTree = treeModule.buildTree(sampleStats1);

//buildTree(sampleStats1)
var expectedString = JSON.stringify(expectedTree);
var actualString = JSON.stringify(actualTree);
console.log(expectedString)
console.log(actualString)
console.log(expectedString == actualString);
