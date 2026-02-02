; ModuleID = '/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll'
source_filename = "/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll"

@.constant_0 = private unnamed_addr constant [4 x i8] c"%d\0A\00", align 1

declare i32 @printf(ptr, ...)

declare noalias ptr @malloc(i64)

declare void @free(ptr)

define i32 @main(ptr %env) {
entry:
  %r2 = alloca { ptr, ptr }, align 8
  %r3 = getelementptr { ptr, ptr }, ptr %r2, i32 0, i32 1
  store ptr @printf, ptr %r3, align 8
  %r4 = getelementptr { ptr, ptr }, ptr %r2, i32 0, i32 1
  %r5 = load ptr, ptr %r4, align 8
  %r6 = getelementptr { ptr, ptr }, ptr %r2, i32 0, i32 0
  %r0 = call ptr %r5(ptr null, ptr @.constant_0, i32 1)
  ret i32 0

0:                                                ; No predecessors!
  ret i32 0
}
