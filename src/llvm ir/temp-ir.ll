declare i32 @printf(i8*, ...)
@.constant_1 = private unnamed_addr constant [6 x i8] c"%.0f\0A\00", align 1
define i32 @main() {
    entry:
    %f = alloca float

%r0 = sitofp i32 1 to float
store float %r0, float* %f

        br label %loop0.body
        loop0.body:
            
%r2 = load float , float* %f


%r4 = sitofp i32 1 to float
%r3 = fadd float %r2, %r4
%r1 = call i32(i8*, ...) @printf(i8* @.constant_1, float %r3)
            br label %loop0.body
        loop0.end:
        
    ret i32 0
}