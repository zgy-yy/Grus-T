declare i32 @printf(i8*, ...)
@.constant_1 = private unnamed_addr constant [7 x i8] c"%d,%d\0A\00", align 1
define i32 @main() {
        entry:
        %i = alloca i32
store i32 3, i32* %i


        %r4 = load i32 , i32* %i
        %r3 = add i32 %r4, 1
        store i32 %r3, i32* %i
        store i32 %r3, i32* %i
%c = alloca i32
store i32 %r3, i32* %c

%r7 = load i32 , i32* %c
%r8 = load i32 , i32* %i
%r6 = call i32(i8*, ...) @printf(i8* @.constant_1, i32 %r7, i32 %r8)

        ret i32 0
       }