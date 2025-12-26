declare i32 @printf(i8*, ...)
@.constant_2 = private unnamed_addr constant [4 x i8] c"%f\0A\00", align 1
define i32 @main() {
        entry:
        %x = alloca float
%turn_reg_0 = sitofp i32 3 to float
store float %turn_reg_0, float* %x

%y = alloca float
%turn_reg_1 = sitofp i32 2.5 to float
store float %turn_reg_1, float* %y

%val_reg_2 = load float , float* %x
%val_reg_3 = load float , float* %y
%bin_reg_4 = fmul float %val_reg_2, %val_reg_3
%z = alloca float
store float %bin_reg_4, float* %z

%val_reg_8 = load float , float* %z
%call_reg_7 = call i32(i8*, ...) @printf(i8* @.constant_2, float %val_reg_8)

        ret i32 0
       }