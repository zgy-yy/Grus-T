declare i32 @printf(i8*, ...)
define void @foo() {
    entry:
    ret void
}
@.constant_0 = private unnamed_addr constant [4 x i8] c"%d\0A\00", align 1

define i32 @main() {
    entry:
    

%r0 = call i32(i8*, ...) @printf(i8* @.constant_0, i32 1)

ret i32 0
}
