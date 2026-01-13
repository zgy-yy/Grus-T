declare i32 @printf(i8*, ...)
@.constant_3 = private unnamed_addr constant [6 x i8] c"i=%d\0A\00", align 1
define i32 @main() {
        entry:
        
        %i = alloca i32
store i32 0, i32* %i

        br label %for0.condition
        for0.condition:
            %r2 = load i32 , i32* %i
%r3 = icmp slt i32 %r2, 3

            %r0= icmp ne i1 %r3, 0
            br i1 %r0, label %for0.body, label %for0.end
        for0.body:
            %r9 = load i32 , i32* %i
%r8 = call i32(i8*, ...) @printf(i8* @.constant_3, i32 %r9)

            %r5 = load i32 , i32* %i
%r6 = add i32 %r5, 1
store i32 %r6, i32* %i

            br label %for0.condition
        for0.end:
        
        ret i32 0
       }