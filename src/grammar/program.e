fun main() i32 {
  let a =12;
  bool b = a>11||(a++,a==12);
  printf("%d,%d",a,b);
}