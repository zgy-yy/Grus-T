; ModuleID = '/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll'
source_filename = "/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll"

@.constant_2 = private unnamed_addr constant [6 x i8] c"%.0f\0A\00", align 1

declare i32 @printf(ptr, ...)

declare noalias ptr @malloc(i64)

declare void @free(ptr)

define i32 @main() {
entry:
  %f = alloca float, align 4
  %r0 = sitofp i32 0 to float
  store float %r0, ptr %f, align 4
  br label %while0.condition

while0.condition:                                 ; preds = %while0.body, %entry
  %r1 = load float, ptr %f, align 4
  %r3 = sitofp i32 3 to float
  %r2 = fcmp olt float %r1, %r3
  br i1 %r2, label %while0.body, label %while0.end

while0.body:                                      ; preds = %while0.condition
  %r5 = load float, ptr %f, align 4
  %r4 = call i32 (ptr, ...) @printf(ptr @.constant_2, float %r5)
  %r7 = load float, ptr %f, align 4
  %r9 = sitofp i32 1 to float
  %r8 = fadd float %r7, %r9
  store float %r8, ptr %f, align 4
  br label %while0.condition

while0.end:                                       ; preds = %while0.condition
  ret i32 0

0:                                                ; No predecessors!
  ret i32 0
}
