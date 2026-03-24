struct Point {
  i32 x, y;
}

fun main() i32 {
  let Point p = { x: 1, y: 2 };
  let @Point rp => p;
  printf("%d\\n", rp.x);
  rp.x = 50;
  printf("%d\\n", p.x);
  return 0;
}