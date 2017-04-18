# Babel Private Field Plugin

This is a plugin provide private fields in a ES6+ class. It's not like [ECMAScript Private Fields](https://github.com/tc39/proposal-private-fields) proposal but auto transform any field start with '_' into private in a class.

## Usage

```bash
npm i babel-plugin-transform-private --save-dev
```

Config `.babelrc` or `package.json`

```json
{
  "plugins": [
    ["../src/transform-private.js", {
      "pattern": "^_"
    }],
  ]
}
```

## Compile results:

### Simple class

input:

```js
export default class Point2D{
  constructor(x, y){
    this._x = x;
    this._y = y;
  }
  get XY(){
    return [this._x, this._y];
  }
  get length(){
    return Math.sqrt(this._x * this._x + this._y * this._y);
  }
}
```

output:

```js
const Point2D = function () {
  const [_x, _y] = [Symbol("_x"), Symbol("_y")];
  class Point2D {
    constructor(x, y) {
      this[_x] = x;
      this[_y] = y;
    }
    get XY() {
      return [this[_x], this[_y]];
    }
    get length() {
      return Math.sqrt(this[_x] * this[_x] + this[_y] * this[_y]);
    }
  }
  return Point2D;
}();

export default Point2D;
```

### Nested class

input:

```js
export default class Outer {
  constructor(){
    this._inner = class Inner{
      constructor(x){
        this._x = x;
      }
      get X(){
        return this._x;
      }
    }
  }
  get innerCls(){
    return this._inner;
  }
}
```

output:

```js
const Outer = function () {
  const [_inner] = [Symbol("_inner")];
  class Outer {
    constructor() {
      this[_inner] = function () {
        const [_x] = [Symbol("_x")];
        return class Inner {
          constructor(x) {
            this[_x] = x;
          }
          get X() {
            return this[_x];
          }
        };
      }();
    }
    get innerCls() {
      return this[_inner];
    }
  }
  return Outer;
}();

export default Outer;
```

### Protected fields & super

input:

```js
export const Foo = class {
  constructor(x, y){
    this._x = x;
    this._y = y;
    this._zz = x + y;  
  }
  //protected filed
  get _z(){
    return this._zz;
  }
}

export const Bar = class extends Foo{
  constructor(x, y){
    super(x * 2, y * 3);
  }
  get z(){
    return super._z; //get x*2+y*3
  }
  get z2(){
    return super._zz; //undefined
  }
}
```

output:

```js
export const Foo = function () {
  const [_x, _y, _zz, _z] = [Symbol("_x"), Symbol("_y"), Symbol("_zz"), Symbol("_z")];
  return class {
    constructor(x, y) {
      this[_x] = x;
      this[_y] = y;
      this[_zz] = x + y;
    }
    get [_z]() {
      return this[_zz];
    }
  };
}();

export const Bar = class extends Foo {
  constructor(x, y) {
    super(x * 2, y * 3);
  }
  get z() {
    return super[Object.getOwnPropertySymbols(this.__proto__.__proto__).filter(s => String(s) === "Symbol(_z)")[0]];
  }
  get z2() {
    return super[Object.getOwnPropertySymbols(this.__proto__.__proto__).filter(s => String(s) === "Symbol(_zz)")[0]];
  }
};
```