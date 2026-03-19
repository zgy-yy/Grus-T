fun main() i32 {
  let i32 a = 10;
  let @i32 ptr1 => a;

  ptr1 = 40;
  printf("%d %d\\n", a,ptr1);
  return 0;
}