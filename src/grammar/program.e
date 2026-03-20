struct Point {
  i32 x, y;
  @i32 ap;
}

fun main() i32 {
  let x=12;
  let Point p = { x: 1, y: 2 ,ap:>x};
  let @Point rp => p;
  rp.x = 50;
  rp.ap = 8;
  printf("%d\\n", x);
  return 0;
}