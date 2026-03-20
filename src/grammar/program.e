struct Point {
  i32 x;
  i8 y;
}

fun main() i32 {
  let Point p = { x: 11, y: <i8>1229 };
  printf("%d\\n", p.x);
  printf("%d\\n", p.y);
  return 0;
}