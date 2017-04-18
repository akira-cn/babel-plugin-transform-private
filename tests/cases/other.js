let A = class{
  get _x() {
    return 10;
  }
}

let B = class extends A{
  get _x(){
    return super._x;
  }
}

export default class C {
  get _y(){
    return 100;
  }
}
