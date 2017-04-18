export class A{
  constructor(x, y){
    //private properties
    this._x = x;
    this._y = y;
  }
  get X(){
    return this._x;
  }
  get Y(){
    return this._y;
  }
  //protected getter
  get _z(){
    return 10;
  }
}

export class B extends A{
  constructor(x, y){
    super(x, y);
  }
  get X(){
    return this._x;
  }
  get Y(){
    return this._y;
  }
  get Z(){
    //console.log(super[Object.getOwnPropertySymbols(this.__proto__.__proto__).filter(s => String(s) === 'Symbol(_A$z)')[0]]);
    return super._z;
  }
}
