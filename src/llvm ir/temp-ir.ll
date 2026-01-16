declare i32 @printf(i8*, ...)
@.constant_3 = private unnamed_addr constant [7 x i8] c"%d,%d\0A\00", align 1
define i32 @main() {
    entry:
    %a = alloca i32


store i32 12, i32* %a
%b = alloca i1
%r1 = load i32 , i32* %a



%r2 = icmp sgt i32 %r1, 11

                br label %or0.start
                or0.start:
                    br i1 %r2, label %or0.exit, label %or0.check
                or0.check:
                    %r5 = load i32 , i32* %a
%r6 = add i32 %r5, 1
store i32 %r6, i32* %a
%r7 = load i32 , i32* %a



%r8 = icmp eq i32 %r7, 12
                    br label %or0.exit
                or0.exit:
                    %r12 = phi i1 [true, %or0.start], [%r8, %or0.check]
                

store i1 %r12, i1* %b

%r15 = load i32 , i32* %a

%r16 = load i1 , i1* %b

%extend_reg_17 = zext i1 %r16 to i32
%r14 = call i32(i8*, ...) @printf(i8* @.constant_3, i32 %r15, i32 %extend_reg_17)
    ret i32 0
}