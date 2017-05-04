module.exports = function ({types: t}) {
  const stack = [];

  function transformPropertyToSymbol(name){
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

  function transformCreateSymbols(){
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

  function transformWrapClass(cls){
    let symbols = transformCreateSymbols();
    if(!symbols) return;

    if(cls.type === 'ClassDeclaration'){
      let expr = t.callExpression(
        t.functionExpression(null, [], 
          t.blockStatement(
            [symbols,
             cls,
             t.returnStatement(
               t.identifier(cls.id.name)
             )]
          )
        ), []
      );

      return t.variableDeclaration(
        'const',
        [t.variableDeclarator(
          t.identifier(cls.id.name),
          expr
        )]
      );
    }else if(cls.type === 'ClassExpression'){
      return t.callExpression(
        t.functionExpression(null, [], 
          t.blockStatement(
            [symbols,
             t.returnStatement(
               cls
             )]
          )
        ), []
      );
    }
  }

  const classVisitor = {
    Identifier(path, state) {
      if(stack.length <= 0) return; //not in class
      if(/^__.*__$/.test(path.node.name)) return; //system preserved, like __proto__

      let node = path.node,
          parentNode = path.parentPath.node,
          meta = stack[stack.length - 1];

      let regExp = new RegExp(state.opts.pattern || '^_');
      let symbolName = '$' + node.name + '$';

      if(parentNode 
         && parentNode.type === 'MemberExpression' 
         && parentNode.object.type === 'ThisExpression'
         && !parentNode.computed
         && regExp.test(node.name)){ //private
        node.name = symbolName;
        meta.variables.add(node.name);
        parentNode.computed = true;
      }else if(parentNode 
         && parentNode.type === 'MemberExpression' 
         && parentNode.object.type === 'Super'
         && !parentNode.computed
         && regExp.test(node.name)){
        node.name = symbolName;
        parentNode.computed = true;
        let expr = transformPropertyToSymbol(node.name);
        path.replaceWith(expr);
      }else if(parentNode 
         && parentNode.type === 'ClassMethod' 
         && regExp.test(node.name)){
        node.name = symbolName;
        meta.variables.add(node.name);
        parentNode.computed = true;
      }
      path.skip();
    },
    Class(path, state) {
      stack.push({
        variables: new Set()
      });
      
      path.traverse(classVisitor, state);

      let expr = transformWrapClass(path.node);
      if(!expr) return;

      if(path.isClassDeclaration() && 
         path.parentPath.isExportDefaultDeclaration()){
        path.parentPath.insertAfter(t.exportDefaultDeclaration(
          t.identifier(path.node.id.name)
        ));
        path.parentPath.replaceWith(expr);
      }else{
        path.replaceWith(expr);
      }
    }
  }

  return {visitor: classVisitor};
}
