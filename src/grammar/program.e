
fun foo(@i32 a) @i32{
  return a;
}

fun main() i32 {

  let x=12;
  let @i32 a=>x;
  foo(a);
  printf("%d",a);
 return 0;
}