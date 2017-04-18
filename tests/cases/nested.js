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
