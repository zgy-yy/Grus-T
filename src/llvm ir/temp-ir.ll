declare i32 @printf(i8*, ...)
@.constant_2 = private unnamed_addr constant [4 x i8] c"%d\0A\00", align 1
define i32 @main() {
        entry:
        %x = alloca float
%turn_reg_0 = sitofp i32 1 to float
store float %turn_reg_0, float* %x

%val_reg_1 = load float , float* %x
%turn_reg_3 = sitofp i32 10 to float
%bin_reg_2 = shl float %val_reg_1, %turn_reg_3
%a = alloca i8
%turn_reg_4 = fptosi float %bin_reg_2 to i8
store i8 %turn_reg_4, i8* %a

%val_reg_6 = load i8 , i8* %a
%call_reg_5 = call i32(i8*, ...) @printf(i8* @.constant_2, i8 %val_reg_6)

        ret i32 0
       }