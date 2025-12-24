declare i32 @printf(i8*, ...)
@.constant_1 = private unnamed_addr constant [4 x i8] c"%f\0A\00" align 1
define i32 @main() {
        entry:
        %unary_reg_0 = sub i32 0, 13
%b = alloca float
%turn_reg_1 = sitofp i32 %unary_reg_0 to float
store float %turn_reg_1, float* %b

%val_reg_3 = load float , float* %b
%val_reg_4 = bitcast i32(i8*, ...)* @printf to i32(i8*, ...)*
call i32(i8*, ...) %val_reg_4(i8* @.constant_1, float %val_reg_3)

        ret i32 0
       }