export default class Example {
  _x = 0;
  _y = 0;
  right() {
    this._x += 1;
  }
  down() {
    this._y += 1;
  }
  get XY() {
    return {
      x: this._x,
      y: this._y
    }
  }
}
