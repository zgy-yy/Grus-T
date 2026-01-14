; ModuleID = '/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll'
source_filename = "/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll"

@.constant_1 = private unnamed_addr constant [4 x i8] c"%d\0A\00", align 1

declare i32 @printf(ptr, ...)

define i32 @main() {
entry:
  %i = alloca i32, align 4
  store i32 0, ptr %i, align 4
  br label %doWhile0.body

doWhile0.body:                                    ; preds = %doWhile0.condition, %entry
  %r2 = load i32, ptr %i, align 4
  %r1 = call i32 (ptr, ...) @printf(ptr @.constant_1, i32 %r2)
  %r4 = load i32, ptr %i, align 4
  %r5 = add i32 %r4, 1
  store i32 %r5, ptr %i, align 4
  br label %doWhile0.condition

doWhile0.condition:                               ; preds = %doWhile0.body
  %r7 = load i32, ptr %i, align 4
  %r8 = icmp sle i32 %r7, 5
  br i1 %r8, label %doWhile0.body, label %doWhile0.end

doWhile0.end:                                     ; preds = %doWhile0.condition
  ret i32 0
}
