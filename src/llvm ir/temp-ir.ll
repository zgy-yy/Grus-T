declare i32 @printf(i8*, ...)
@.constant_2 = private unnamed_addr constant [4 x i8] c"%d\0A\00", align 1
define i32 @main() {
    entry:
    %i = alloca i32


store i32 0, i32* %i

        br label %while0.condition
        while0.condition:
            %r1 = load i32 , i32* %i



%r2 = icmp slt i32 %r1, 1
            br i1 %r2, label %while0.body, label %while0.end
        while0.body:
            
%r6 = load i32 , i32* %i
%r7 = add i32 %r6, 1
store i32 %r7, i32* %i
%r4 = call i32(i8*, ...) @printf(i8* @.constant_2, i32 %r6)
            br label %while0.condition
        while0.end:
        
    ret i32 0
}