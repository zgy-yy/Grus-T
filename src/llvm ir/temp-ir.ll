declare i32 @printf(i8*, ...)
define i1 @isTrue() {
    entry:
    
    
ret i1 1
    ret i1 zeroinitializer
}
@.constant_1 = private unnamed_addr constant [4 x i8] c"ok\0A\00", align 1

define i32 @main() {
    entry:
    
    
        %r0 = call i1() @isTrue()

                br label %and0.start
                and0.start:
                br i1 %r0, label %and0.check, label %and0.exit
                and0.check:
                    %r1 = call i1() @isFalse()
%r2 = xor i1 %r1, 1
                    br label %and0.exit
                and0.exit:
                    %r4 = phi i1 [false, %and0.start], [%r2, %and0.check]
                
        br i1 %r4, label %if0.then, label %if0.else
        if0.then:
            
%r5 = call i32(i8*, ...) @printf(i8* @.constant_1)
            br label %if0.end
        if0.else:
            
            br label %if0.end
        if0.end:
        

ret i32 0
    ret i32 zeroinitializer
}
define i1 @isFalse() {
    entry:
    
    
ret i1 0
    ret i1 zeroinitializer
}

