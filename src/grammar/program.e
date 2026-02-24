fun main() i32 {
  let i32 i = 0;
  loop {
    printf("%d\\n", i);
    i = i + 1;
    if (i >= 10) {
      break;
    }
  }
  return 0;
}