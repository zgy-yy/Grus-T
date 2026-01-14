; ModuleID = '/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll'
source_filename = "/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll"

@.constant_1 = private unnamed_addr constant [7 x i8] c"%d,%d\0A\00", align 1

declare i32 @printf(ptr, ...)

define i32 @main() {
entry:
  %i = alloca i32, align 4
  store i32 3, ptr %i, align 4
  %r4 = load i32, ptr %i, align 4
  %r3 = add i32 %r4, 1
  store i32 %r3, ptr %i, align 4
  store i32 %r3, ptr %i, align 4
  %c = alloca i32, align 4
  store i32 %r3, ptr %c, align 4
  %r7 = load i32, ptr %c, align 4
  %r8 = load i32, ptr %i, align 4
  %r6 = call i32 (ptr, ...) @printf(ptr @.constant_1, i32 %r7, i32 %r8)
  ret i32 0
}
