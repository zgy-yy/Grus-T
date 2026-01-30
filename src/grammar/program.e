fun addOne(i32 x) i32 {
  return x + 1;
}

fun addTwo(i32 x) i32 {
  return addOne(addOne(x));
}

fun main() i32 {
  let i32 result = addTwo(5);
  printf("%d\\n", result);
  return 0;
}