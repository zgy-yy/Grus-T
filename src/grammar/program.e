struct Point {
  i32 x, y;
  @i32 ap;
}

fun foo(@Point x)@Point{
  return x;
}

fun main() i32 {
  let x=12;
  let b =89;
  let Point p = { x: 1, y: 2 ,ap:>x};
  let @Point rp => p;
  foo(p).ap=>b;
  printf("%d\\n", p.ap);
  return 0;
}