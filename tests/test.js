import test from 'ava';

import Point2D from './cases/point2d.js';
import Outer from './cases/nested.js';
import {A, B} from './cases/protected.js';
import {Foo, Bar} from './cases/expression.js';

test('private _x, _y', t => {
  var p = new Point2D(3, 4);
  t.is(p.length, 5);
  t.deepEqual(p.XY, [3, 4]);
  t.is(p._x, undefined);
  t.is(p._y, undefined);
});

test('private and protected', t => {
  var b = new B(3, 4),
      a = new A(1, 2);
  t.is(a.X, 1);
  t.is(a.Y, 2);
  t.is(b.X, undefined);
  t.is(b.Y, undefined);
  t.is(b.Z, 10);
  t.is(b._z, undefined);
});

test('nested', t => {
  var outer = new Outer(),
      inner = new outer.innerCls(10);

  t.is(inner.X, 10);
  t.is(inner._x, undefined);
  t.is(outer._inner, undefined);
});

test('expression', t => {
  var foo = new Foo(1, 2),
      bar = new Bar(1, 2);

  t.is(foo._x, undefined);
  t.is(foo._zz, undefined);
  t.is(foo._z, undefined);
  t.is(bar.z, 8);
  t.is(bar.z2, undefined);
});
