declare i32 @printf(i8*, ...)
define i32 @foo() {
    entry:
    
        
        br i1 1, label %if1.then, label %if1.else
        if1.then:
            
ret i32 2

        
        br i1 0, label %if0.then, label %if0.else
        if0.then:
            
ret i32 23
            br label %if0.end
        if0.else:
            
ret i32 23
            br label %if0.end
        if0.end:
        
            br label %if1.end
        if1.else:
            
ret i32 1
            br label %if1.end
        if1.end:
        
    ret i32 zeroinitializer
}
@.constant_6 = private unnamed_addr constant [4 x i8] c"%d\0A\00", align 1

define i32 @main() {
    entry:
    

%r0 = call i32(i8*, ...) @printf(i8* @.constant_6, i32 1)

ret i32 0
    ret i32 zeroinitializer
}
