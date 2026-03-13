fun main() i32 {
  let i8 a = 255;
  let i8 b = 1;
  let i8 c = a | b;
  let i32 x = <i32>c;
  printf("%d\\n", x);
  return 0;
}