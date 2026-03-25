fun main() i32 {
  let [2]i32 a = [1, 2];
  let @[2]i32 p => a;
  p[1] = 42;

  printf("%d",a[1]);
  return 0;
}