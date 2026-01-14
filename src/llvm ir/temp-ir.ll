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

             br label %doWhile0.condition
        doWhile0.condition:
            %r3 = load i32 , i32* %i
%r4 = icmp slt i32 %r3, 1

            %r6= icmp ne i1 %r4, 0
            br i1 %r6, label %doWhile0.body, label %doWhile0.end
        doWhile0.end:
        
        ret i32 0
       }