
fun foo() ()->i32 {
  let i32 a=23;
  let @i32 pt =>a;
  let bar =()->i32{
    return pt;
  };
  printf("%d,",pt);
  return bar;
}

fun main() i32 {
 let c= foo();
 let num =c();
   printf("%d,",num);
  return 0;
}