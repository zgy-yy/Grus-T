; ModuleID = '/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll'
source_filename = "/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll"

@.constant_1 = private unnamed_addr constant [4 x i8] c"%d\0A\00", align 1
@.constant_4 = private unnamed_addr constant [4 x i8] c"%d\0A\00", align 1

declare i32 @printf(ptr, ...)

define i32 @main() {
entry:
  %x = alloca i32, align 4
  store i32 0, ptr %x, align 4
  %r2 = load i32, ptr %x, align 4
  %r1 = call i32 (ptr, ...) @printf(ptr @.constant_1, i32 %r2)
  store i32 10, ptr %x, align 4
  br label %skip

0:                                                ; No predecessors!
  store i32 20, ptr %x, align 4
  br label %skip

skip:                                             ; preds = %0, %entry
  %r6 = load i32, ptr %x, align 4
  %r5 = call i32 (ptr, ...) @printf(ptr @.constant_4, i32 %r6)
  ret i32 0
}
