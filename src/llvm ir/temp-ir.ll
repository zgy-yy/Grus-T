declare i32 @printf(i8*, ...)
@.constant_2 = private unnamed_addr constant [4 x i8] c"%d\0A\00", align 1
define i32 @main() {
        entry:
        %x = alloca i32
store i32 15, i32* %x

%mask = alloca i32
store i32 12, i32* %mask

%val_reg_2 = load i32 , i32* %x
%val_reg_3 = load i32 , i32* %mask
%unary_reg_4 = xor i32 %val_reg_3, -1
%bin_reg_5 = and i32 %val_reg_2, %unary_reg_4
%result = alloca i32
store i32 %bin_reg_5, i32* %result

%val_reg_9 = load i32 , i32* %result
%call_reg_8 = call i32(i8*, ...) @printf(i8* @.constant_2, i32 %val_reg_9)

        ret i32 0
       }