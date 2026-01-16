; ModuleID = '/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll'
source_filename = "/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll"

@.constant_1 = private unnamed_addr constant [6 x i8] c"%.0f\0A\00", align 1

declare i32 @printf(ptr, ...)

define i32 @main() {
entry:
  %f = alloca float, align 4
  %r0 = sitofp i32 1 to float
  store float %r0, ptr %f, align 4
  br label %loop0.body

loop0.body:                                       ; preds = %loop0.body, %entry
  %r2 = load float, ptr %f, align 4
  %r4 = sitofp i32 1 to float
  %r3 = fadd float %r2, %r4
  %r1 = call i32 (ptr, ...) @printf(ptr @.constant_1, float %r3)
  br label %loop0.body

loop0.end:                                        ; No predecessors!
  ret i32 0
}
