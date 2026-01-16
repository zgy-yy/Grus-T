declare i32 @printf(i8*, ...)
@.constant_1 = private unnamed_addr constant [4 x i8] c"%d\0A\00", align 1

@.constant_4 = private unnamed_addr constant [4 x i8] c"%d\0A\00", align 1
define i32 @main() {
    entry:
    %x = alloca i32


store i32 0, i32* %x

%r2 = load i32 , i32* %x

%r1 = call i32(i8*, ...) @printf(i8* @.constant_1, i32 %r2)

store i32 10, i32* %x
br label %skip

store i32 20, i32* %x
br label %skip
skip:

%r6 = load i32 , i32* %x

%r5 = call i32(i8*, ...) @printf(i8* @.constant_4, i32 %r6)
    ret i32 0
}