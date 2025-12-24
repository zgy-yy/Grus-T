declare i32 @printf(i8*, ...)
@.constant_0 = private unnamed_addr constant [7 x i8] c"hello\0A\00" align 1
@.constant_1 = private unnamed_addr constant [6 x i8] c"haha\0A\00" align 1
@.constant_2 = private unnamed_addr constant [4 x i8] c"%s\0A\00" align 1
@.a = global i8* @.constant_0
define i32 @main() {
        entry:
        store i8* @.constant_1, i8** @.a
%val_reg_1 = load i8* , i8** @.a
%val_reg_2 = bitcast i32(i8*, ...)* @printf to i32(i8*, ...)*
call i32(i8*, ...) %val_reg_2(i8* @.constant_2, i8* %val_reg_1)
ret i32 0
}