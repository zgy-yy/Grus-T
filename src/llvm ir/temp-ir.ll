declare i32 @printf(i8*, ...)
declare noalias i8* @malloc(i64)
declare void @free(i8*)
@.constant_0 = private unnamed_addr constant [4 x i8] c"%d\0A\00", align 1

@.constant_2 = private unnamed_addr constant [4 x i8] c"%d\0A\00", align 1

define void @lf4() {
    entry:
    
    


%r5  = call i32(i8*, ...) @printf(i8* @.constant_2, i32 4)
    ret void 
}
define i32 @main() {
    entry:
    
    
call void() @foo()



%r2  = call i32(i8*, ...) @printf(i8* @.constant_0, i32 1)
%bar = alloca void()*


store void()* @lf4, void()** %bar
%r9  = load void()* , void()** %bar

call void()* %r9 ()

ret i32 0
    ret i32 zeroinitializer
}
@.constant_5 = private unnamed_addr constant [4 x i8] c"%d\0A\00", align 1

define void @foo() {
    entry:
    
    


%r0  = call i32(i8*, ...) @printf(i8* @.constant_5, i32 3)
    ret void 
}
