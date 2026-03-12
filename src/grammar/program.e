fun main() i32 {
  let (i32) -> bool isEven = (i32 n) -> bool {
    return n % 2 == 0;
  };
  let bool result = isEven(4);
  printf("%d\\n", result);
  return 0;
}