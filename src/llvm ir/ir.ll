; ModuleID = '/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll'
source_filename = "/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll"

@.constant_2 = private unnamed_addr constant [6 x i8] c"i=%d\0A\00", align 1

declare i32 @printf(ptr, ...)

define i32 @main() {
entry:
  %i = alloca i32, align 4
  store i32 0, ptr %i, align 4
  br label %for0.condition

for0.condition:                                   ; preds = %for0.body, %entry
  %r2 = load i32, ptr %i, align 4
  %r3 = icmp slt i32 %r2, 3
  %r0 = icmp ne i1 %r3, false
  br i1 %r0, label %for0.body, label %for0.end

for0.body:                                        ; preds = %for0.condition
  %r6 = load i32, ptr %i, align 4
  %r5 = call i32 (ptr, ...) @printf(ptr @.constant_2, i32 %r6)
  %r7 = load i32, ptr %i, align 4
  %r8 = add i32 %r7, 1
  store i32 %r8, ptr %i, align 4
  br label %for0.condition

for0.end:                                         ; preds = %for0.condition
  ret i32 0
}
