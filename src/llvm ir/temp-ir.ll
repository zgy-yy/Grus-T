declare i32 @printf(i8*, ...)
@.constant_0 = private unnamed_addr constant [6 x i8] c"a,%d\0A\00", align 1

define i32 @foo(i32 %a) {
    entry:
    %a.addr = alloca i32
store i32 %a, i32* %a.addr
    
%r1 = load i32 , i32* %a.addr

%r0 = call i32(i8*, ...) @printf(i8* @.constant_0, i32 %r1)

ret i32 23
    ret i32 zeroinitializer
}
@.constant_3 = private unnamed_addr constant [4 x i8] c"%d\0A\00", align 1

define i32 @main() {
    entry:
    
    
%a = alloca i32

%r2 = call i32(i32) @foo(i32 2)

store i32 %r2, i32* %a

%r5 = load i32 , i32* %a

%r4 = call i32(i8*, ...) @printf(i8* @.constant_3, i32 %r5)

ret i32 0
    ret i32 zeroinitializer
}