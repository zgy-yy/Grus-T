
fun foo(i32 x) (i32)->void {
  let a= (i32 i)->void{
    printf("%d,%d",i,x);
  };
  a(1);
  return a;
}

fun main() i32 {
  let (i32)->void b = foo(2);
  b(1);
  return 0;
}