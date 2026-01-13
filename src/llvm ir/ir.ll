; ModuleID = '/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll'
source_filename = "/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll"

@.constant_2 = private unnamed_addr constant [4 x i8] c"%d\0A\00", align 1

declare i32 @printf(ptr, ...)

define i32 @main() {
entry:
  %i = alloca i32, align 4
  store i32 1, ptr %i, align 4
  br label %while0.condition

while0.condition:                                 ; preds = %while0.body, %entry
  %r1 = load i32, ptr %i, align 4
  %r2 = icmp slt i32 %r1, 23
  %r9 = icmp ne i1 %r2, false
  br i1 %r9, label %while0.body, label %while0.end

while0.body:                                      ; preds = %while0.condition
  %r5 = load i32, ptr %i, align 4
  %r4 = call i32 (ptr, ...) @printf(ptr @.constant_2, i32 %r5)
  %r6 = load i32, ptr %i, align 4
  %r7 = add i32 %r6, 1
  store i32 %r7, ptr %i, align 4
  br label %while0.condition

while0.end:                                       ; preds = %while0.condition
  ret i32 0
}
