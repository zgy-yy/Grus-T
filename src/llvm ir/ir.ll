; ModuleID = '/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll'
source_filename = "/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll"

@.constant_2 = private unnamed_addr constant [4 x i8] c"%d\0A\00", align 1
@.constant_3 = private unnamed_addr constant [4 x i8] c"%d\0A\00", align 1

declare i32 @printf(ptr, ...)

define i32 @main() {
entry:
  %i = alloca i32, align 4
  store i32 0, ptr %i, align 4
  br label %for0.condition

for0.condition:                                   ; preds = %for0.body, %entry
  %r1 = load i32, ptr %i, align 4
  %r2 = icmp slt i32 %r1, 12
  br i1 %r2, label %for0.body, label %for0.end

for0.body:                                        ; preds = %for0.condition
  %r8 = load i32, ptr %i, align 4
  %r7 = call i32 (ptr, ...) @printf(ptr @.constant_2, i32 %r8)
  %r5 = load i32, ptr %i, align 4
  %r6 = add i32 %r5, 1
  store i32 %r6, ptr %i, align 4
  br label %for0.condition

for0.end:                                         ; preds = %for0.condition
  %r10 = load i32, ptr %i, align 4
  %r9 = call i32 (ptr, ...) @printf(ptr @.constant_3, i32 %r10)
  ret i32 0

0:                                                ; No predecessors!
  ret i32 0
}
