fun main() i32 {

let x=1;
  let () -> i32 f = () -> i32 {
  x=2;
    let x=22;
    printf("%d",x);
    return 42;
  };
  let i32 result = f();
  printf("%d\\n", result);
  return 0;
}