declare i32 @printf(i8*, ...)
declare noalias i8* @malloc(i64)
declare void @free(i8*)
@.constant_2 = private unnamed_addr constant [6 x i8] c"%.0f\0A\00", align 1

define i32 @main() {
    entry:
    
    %f = alloca float

%r0 = sitofp i32 0 to float
store float %r0, float* %f

        br label %while0.condition
        while0.condition:
            %r1 = load float , float* %f


%r3 = sitofp i32 3 to float
%r2 = fcmp olt float %r1, %r3
            br i1 %r2, label %while0.body, label %while0.end
        while0.body:
            
%r5 = load float , float* %f

%r4 = call i32(i8*, ...) @printf(i8* @.constant_2, float %r5)
%r7 = load float , float* %f


%r9 = sitofp i32 1 to float
%r8 = fadd float %r7, %r9
store float %r8, float* %f
            br label %while0.condition
        while0.end:
        

ret i32 0
    ret i32 zeroinitializer
}