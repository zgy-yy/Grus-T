declare i32 @printf(i8*, ...)
@.constant_3 = private unnamed_addr constant [4 x i8] c"%d\0A\00", align 1
define i32 @main() {
        entry:
        %a = alloca i1
store i1 0, i1* %a

%i = alloca i32
store i32 9, i32* %i


        %r4 = load i32 , i32* %i
        %r5 = add i32 %r4, 1
        store i32 %r5, i32* %i
        %r6 = load i32 , i32* %i
%r7 = icmp slt i32 %r6, 8
store i1 %r7, i1* %a

%r11 = load i32 , i32* %i
%r10 = call i32(i8*, ...) @printf(i8* @.constant_3, i32 %r11)

        ret i32 0
       }