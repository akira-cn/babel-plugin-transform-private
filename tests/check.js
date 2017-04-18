const code = require("fs").readFileSync("./tests/cases/other.js", "utf-8");

const ast = require("babylon").parse(code, {
  // parse in strict mode and allow module declarations
  sourceType: "module",
  filename: "test.js"
});

const traverse = require("babel-traverse").default;
var indent = "";

traverse(ast, {
  enter(path) {
    // if(path.node.type === 'ClassDeclaration'){
    //   console.log(path.node, path.node.superClass && path.node.superClass.name);
    // }
    console.log(indent + "<" + path.node.type + ">");
    indent += "  ";
  },
  exit(path){
    indent = indent.slice(0, -2);
    console.log(indent + "<" + "/" + path.node.type + ">");
  }
});
