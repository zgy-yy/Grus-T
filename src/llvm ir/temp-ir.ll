declare i32 @printf(i8*, ...)
@.constant_2 = private unnamed_addr constant [4 x i8] c"%d\0A\00", align 1

@.constant_3 = private unnamed_addr constant [4 x i8] c"%d\0A\00", align 1

define i32 @main() {
    entry:
    
    
        %i = alloca i32


store i32 0, i32* %i
        br label %for0.condition
        for0.condition:
            %r1 = load i32 , i32* %i



%r2 = icmp slt i32 %r1, 12
            br i1 %r2, label %for0.body, label %for0.end
        for0.body:
            
%r8 = load i32 , i32* %i

%r7 = call i32(i8*, ...) @printf(i8* @.constant_2, i32 %r8)
            %r5 = load i32 , i32* %i
%r6 = add i32 %r5, 1
store i32 %r6, i32* %i
            br label %for0.condition
        for0.end:
        

%r10 = load i32 , i32* %i

%r9 = call i32(i8*, ...) @printf(i8* @.constant_3, i32 %r10)

ret i32 0
    ret i32 zeroinitializer
}