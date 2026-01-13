declare i32 @printf(i8*, ...)
@.constant_3 = private unnamed_addr constant [15 x i8] c"negative true\0A\00", align 1
@.constant_6 = private unnamed_addr constant [4 x i8] c"44\0A\00", align 1
@.constant_7 = private unnamed_addr constant [7 x i8] c"false\0A\00", align 1
define i32 @main() {
        entry:
        %x = alloca i32
store i32 23, i32* %x
%y = alloca i32
store i32 23, i32* %y


        
        %r10= icmp ne i32 0, 0

        br i1 %r10, label %if1.then, label %if1.else
        if1.then:
            %r2 = call i32(i8*, ...) @printf(i8* @.constant_3)

            br label %if1.end
        if1.else:
            %x1 = alloca i32
store i32 23, i32* %x1

        %r4 = load i32 , i32* %x1
%r5 = icmp slt i32 %r4, 44

        %r8= icmp ne i1 %r5, 0

        br i1 %r8, label %if0.then, label %if0.else
        if0.then:
            %r7 = call i32(i8*, ...) @printf(i8* @.constant_6)

            br label %if0.end
        if0.else:
            
            br label %if0.end
        if0.end:
        %r9 = call i32(i8*, ...) @printf(i8* @.constant_7)

            br label %if1.end
        if1.end:
        
        ret i32 0
       }