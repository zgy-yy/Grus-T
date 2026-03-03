
fun step3(i32 i) void {
  printf("%d,",i);
}

fun main() i32 {
    let (i32)->void foo= step3;
    let ()->void bar=()->void{
      foo(1);
    };
    bar();
    step3(1);
  return 0;
}