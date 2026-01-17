; ModuleID = '/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll'
source_filename = "/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll"

@.constant_0 = private unnamed_addr constant [4 x i8] c"%d\0A\00", align 1

declare i32 @printf(ptr, ...)

define void @foo() {
entry:
  ret void
}

define i32 @main() {
entry:
  %r0 = call i32 (ptr, ...) @printf(ptr @.constant_0, i32 1)
  ret i32 0
}
