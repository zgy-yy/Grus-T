fun getValue() i32 {
  return 10;
}

fun add(i32 a, i32 b) i32 {
  return a + b;
}

fun main() i32 {
  let i32 result = add(getValue(), 5);
  printf("%d\\n", result);
  return 0;
}