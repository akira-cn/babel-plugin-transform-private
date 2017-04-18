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
