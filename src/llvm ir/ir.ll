; ModuleID = '/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll'
source_filename = "/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll"

@.constant_3 = private unnamed_addr constant [4 x i8] c"%d\0A\00", align 1

declare i32 @printf(ptr, ...)

define i32 @main() {
entry:
  %a = alloca i1, align 1
  store i1 false, ptr %a, align 1
  %i = alloca i32, align 4
  store i32 9, ptr %i, align 4
  %r4 = load i32, ptr %i, align 4
  %r5 = add i32 %r4, 1
  store i32 %r5, ptr %i, align 4
  %r6 = load i32, ptr %i, align 4
  %r7 = icmp slt i32 %r6, 8
  store i1 %r7, ptr %a, align 1
  %r11 = load i32, ptr %i, align 4
  %r10 = call i32 (ptr, ...) @printf(ptr @.constant_3, i32 %r11)
  ret i32 0
}
