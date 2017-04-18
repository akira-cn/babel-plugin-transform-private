module.exports = function ({types: t}) {
  const stack = [];

  function getPropertyFromSymbol(name){
    let expr = t.callExpression(
      t.memberExpression(
        t.identifier('Object'),
        t.identifier('getOwnPropertySymbols')
      ), [
        t.memberExpression(
          t.memberExpression(
            t.thisExpression(),
            t.identifier('__proto__')
          ),
          t.identifier('__proto__')
        )
      ]
    );

    expr = t.callExpression(
      t.memberExpression(
        expr,
        t.identifier('filter')
      ),
      [
        t.arrowFunctionExpression(
          [t.identifier('s')],
          t.binaryExpression(
            '===',
            t.callExpression(
              t.identifier('String'),
              [t.identifier('s')]
            ),
            t.stringLiteral(`Symbol(${name})`)
          )
        )
      ]
    );

    expr = t.memberExpression(
      expr,
      t.numericLiteral(0),
      true
    );

    return expr;
  }

  function createSymbols(){
      let meta = stack.pop(),
          variableNames = Array.from(meta.variables);
      
      //no private variables
      if(variableNames.length <= 0) return;

      let identifiers = variableNames.map(id => t.identifier(id));

      let pattern = t.arrayPattern(identifiers);

      let symbols = variableNames.map(id =>  
        t.callExpression(t.identifier('Symbol'), [t.stringLiteral(id)]));
      
      symbols = t.arrayExpression(symbols);

      return t.variableDeclaration(
        'const',
        [t.variableDeclarator(pattern, symbols)]
      );  
  }

  const classVisitor = {
    Identifier(path, state) {
      if(stack.length <= 0) return; //not in class
      if(/^__.*__$/.test(path.node.name)) return; //system preserved, like __proto__

      let node = path.node,
          parentNode = path.parentPath.node,
          meta = stack[stack.length - 1];

      let regExp = new RegExp(state.opts.pattern || '^_');

      if(parentNode 
         && parentNode.type === 'MemberExpression' 
         && parentNode.object.type === 'ThisExpression'
         && !parentNode.computed
         && regExp.test(node.name)){ //private

        meta.variables.add(node.name);
        parentNode.computed = true;
      }else if(parentNode 
         && parentNode.type === 'MemberExpression' 
         && parentNode.object.type === 'Super'
         && !parentNode.computed
         && regExp.test(node.name)){

        parentNode.computed = true;
        let expr = getPropertyFromSymbol(node.name);
        path.replaceWith(expr);
        path.skip();
      }else if(parentNode 
         && parentNode.type === 'ClassMethod' 
         && regExp.test(node.name)){

        meta.variables.add(node.name);
        parentNode.computed = true;
      }
    },
    ClassDeclaration: {
      exit(path){
        let expr = createSymbols();
        if(!expr) return;

        expr = t.callExpression(
          t.functionExpression(null, [], 
            t.blockStatement(
              [expr,
               path.node,
               t.returnStatement(
                 t.identifier(path.node.id.name)
               )]
            )
          ), []
        );

        expr = t.variableDeclaration(
          'const',
          [t.variableDeclarator(
            t.identifier(path.node.id.name),
            expr
          )]
        );

        if(path.parentPath.node.type === 'ExportDefaultDeclaration'){
          path.parentPath.insertAfter(t.exportDefaultDeclaration(
            t.identifier(path.node.id.name)
          ));
          path.parentPath.replaceWith(expr);
        }else{
          path.replaceWith(expr);
        }
        
        path.skip();

        //export class Foo; export default class Foo; ect.
        // if(/^export/i.test(path.parentPath.node.type)){
        //   path.parentPath.insertBefore(expr);
        // }else{
        //   path.insertBefore(expr);
        // }
        
        // path.skip();
      },
      enter(path, state){
        stack.push({
          variables: new Set()
        });
      }
    },
    ClassExpression: {
      exit(path){
        let expr = createSymbols();
        if(!expr) return;

        expr = t.callExpression(
          t.functionExpression(null, [], 
            t.blockStatement(
              [expr,
               t.returnStatement(
                 path.node
               )]
            )
          ), []
        );

        path.replaceWith(expr);
        
        path.skip();
      },      
      enter(path, state){
        stack.push({
          variables: new Set()
        });
      }    
    }
  }

  return {
    visitor: {
      Program(path, state) {
        path.traverse(classVisitor, state);
      }
    }
  };
}
