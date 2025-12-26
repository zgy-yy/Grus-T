declare i32 @printf(i8*, ...)
@.constant_1 = private unnamed_addr constant [4 x i8] c"%f\0A\00", align 1
@.a = global i32 zeroinitializer
define i32 @main() {
        entry:
        %b = alloca float
%turn_reg_0 = sitofp i32 23 to float
store float %turn_reg_0, float* %b

%val_reg_1 = load float , float* %b
%val_reg_2 = load i32 , i32* @.a
%turn_reg_4 = sitofp i32 %val_reg_2 to float
%bin_reg_3 = fdiv float %val_reg_1, %turn_reg_4
store float %bin_reg_3, float* %b

%val_reg_6 = load float , float* %b
%call_reg_5 = call i32(i8*, ...) @printf(i8* @.constant_1, float %val_reg_6)

        ret i32 0
       }