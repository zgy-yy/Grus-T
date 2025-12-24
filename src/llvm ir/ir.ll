declare i32 @printf(i8*, ...)
@.constant_2 = private unnamed_addr constant [4 x i8] c"%d\0A\00" align 1
@.a = global i32 23
define i32 @main() {
        entry:
        store i32 23, i32* @.a
%str_reg_1 = getelementptr inbounds [4 x i8], [4 x i8]* @.constant_2, i32 0, i32 0
%val_reg_2 = load i32 , i32* @.a
%val_reg_3 = bitcast i32(i8*, ...)* @printf to i32(i8*, ...)*
call i32(i8*, ...) %val_reg_3(i8* %str_reg_1, i32 %val_reg_2)

        ret i32 0
       }