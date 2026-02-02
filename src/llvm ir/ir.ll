; ModuleID = '/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll'
source_filename = "/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll"

@.constant_0 = private unnamed_addr constant [4 x i8] c"%d\0A\00", align 1
@.constant_2 = private unnamed_addr constant [4 x i8] c"%d\0A\00", align 1
@.constant_5 = private unnamed_addr constant [4 x i8] c"%d\0A\00", align 1

declare i32 @printf(ptr, ...)

declare noalias ptr @malloc(i64)

declare void @free(ptr)

define void @lf4() {
entry:
  %r5 = call i32 (ptr, ...) @printf(ptr @.constant_2, i32 4)
  ret void
}

define i32 @main() {
entry:
  call void @foo()
  %r2 = call i32 (ptr, ...) @printf(ptr @.constant_0, i32 1)
  %bar = alloca ptr, align 8
  store ptr @lf4, ptr %bar, align 8
  %r9 = load ptr, ptr %bar, align 8
  %0 = call ptr %r9()
  ret i32 0

1:                                                ; No predecessors!
  ret i32 0
}

define void @foo() {
entry:
  %r0 = call i32 (ptr, ...) @printf(ptr @.constant_5, i32 3)
  ret void
}
