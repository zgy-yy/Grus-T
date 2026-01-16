; ModuleID = '/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll'
source_filename = "/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll"

@.constant_1 = private unnamed_addr constant [6 x i8] c"%.0f\0A\00", align 1

declare i32 @printf(ptr, ...)

define i32 @main() {
entry:
  %f = alloca float, align 4
  %r0 = sitofp i32 0 to float
  store float %r0, ptr %f, align 4
  br label %doWhile0.body

doWhile0.body:                                    ; preds = %doWhile0.condition, %entry
  %r2 = load float, ptr %f, align 4
  %r1 = call i32 (ptr, ...) @printf(ptr @.constant_1, float %r2)
  %r4 = load float, ptr %f, align 4
  %r6 = sitofp i32 1 to float
  %r5 = fadd float %r4, %r6
  store float %r5, ptr %f, align 4
  br label %doWhile0.condition

doWhile0.condition:                               ; preds = %doWhile0.body
  %r7 = load float, ptr %f, align 4
  %r9 = sitofp i32 3 to float
  %r8 = fcmp olt float %r7, %r9
  br i1 %r8, label %doWhile0.body, label %doWhile0.end

doWhile0.end:                                     ; preds = %doWhile0.condition
  ret i32 0
}
