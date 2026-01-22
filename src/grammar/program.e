fun isTrue() bool {
  return true;
}

fun isFalse() bool {
  return false;
}

fun main() i32 {
  if (isTrue() && !isFalse()) {
    printf("ok");
  }
  return 0;
}