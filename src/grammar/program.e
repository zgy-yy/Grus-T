fun main() i32 {
foo();
 printf("%d",1);

 let ()->void bar =()->void{
  printf("%d",4);
 };
 bar();
  return 0;
}

fun foo(){
  printf("%d",3);
}