fun main() i32 {
  i32 a = 1;
  i32 b = 2;
  goto swap;
  swap:
  i32 temp = a;
  a = b;
  b = temp;
  printf("%d,%d", a, b);
}