export const Foo = class {
  constructor(x, y){
    this._x = x;
    this._y = y;
    this._zz = x + y;  
  }
  get _z(){
    return this._zz;
  }
}


export const Bar = class extends Foo{
  constructor(x, y){
    super(x * 2, y * 3);
  }
  get z(){
    return super._z;
  }
  get z2(){
    return super._zz;
  }
}
