declare i32 @printf(i8*, ...)
@.constant_1 = private unnamed_addr constant [4 x i8] c"%d\0A\00", align 1
define i32 @main() {
        entry:
        %x = alloca i8
%turn_reg_0 = trunc i32 0 to i8
store i8 %turn_reg_0, i8* %x

%val_reg_2 = load i8 , i8* %x
%extend_reg_3 = sext i8 %val_reg_2 to i32
%call_reg_1 = call i32(i8*, ...) @printf(i8* @.constant_1, i32 %extend_reg_3)

        ret i32 0
       }