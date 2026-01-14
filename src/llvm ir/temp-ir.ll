declare i32 @printf(i8*, ...)
@.constant_1 = private unnamed_addr constant [4 x i8] c"%d\0A\00", align 1
define i32 @main() {
        entry:
        %i = alloca i32
store i32 0, i32* %i


        br label %doWhile0.body
        doWhile0.body:
            %r2 = load i32 , i32* %i
%r1 = call i32(i8*, ...) @printf(i8* @.constant_1, i32 %r2)
%r4 = load i32 , i32* %i
%r5 = add i32 %r4, 1
store i32 %r5, i32* %i

             br label %doWhile0.condition
        doWhile0.condition:
            %r7 = load i32 , i32* %i
%r8 = icmp sle i32 %r7, 5

            br i1 %r8, label %doWhile0.body, label %doWhile0.end
        doWhile0.end:
        
        ret i32 0
       }