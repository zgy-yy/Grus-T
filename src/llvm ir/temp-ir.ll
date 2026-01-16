declare i32 @printf(i8*, ...)
@.constant_1 = private unnamed_addr constant [6 x i8] c"%.0f\0A\00", align 1
define i32 @main() {
    entry:
    %f = alloca float

%r0 = sitofp i32 0 to float
store float %r0, float* %f

        br label %doWhile0.body
        doWhile0.body:
            %r2 = load float , float* %f
%r1 = call i32(i8*, ...) @printf(i8* @.constant_1, float %r2)

%r4 = load float , float* %f


%r6 = sitofp i32 1 to float
%r5 = fadd float %r4, %r6
store float %r5, float* %f
             br label %doWhile0.condition
        doWhile0.condition:
            %r7 = load float , float* %f


%r9 = sitofp i32 3 to float
%r8 = fcmp olt float %r7, %r9
            br i1 %r8, label %doWhile0.body, label %doWhile0.end
        doWhile0.end:
        
    ret i32 0
}