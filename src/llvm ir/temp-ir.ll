declare i32 @printf(i8*, ...)
declare noalias i8* @malloc(i64)
declare void @free(i8*)
define void @foo(i32 %b.p) {
    entry:
    %b1 = alloca i32
store i32 %b.p, i32* %b1
    
store i32 23, i32* %a
    ret void 
}
define i32 @main() {
    entry:
    
    %r0 = getelementptr {i32,i32},{i32,i32}* null, i64 1)
%r1 = ptrtoint {i32,i32}* %r0 to i64
%r2 = malloc i64 %r1
%a = bitcast %r2 to i32

store i32 1, i32* %a
%b = alloca i32


store i32 23, i32* %b


call void(i32) @foo(i32 2)

ret i32 0
    ret i32 zeroinitializer
}