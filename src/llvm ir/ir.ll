; ModuleID = '/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll'
source_filename = "/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll"

@.constant_3 = private unnamed_addr constant [7 x i8] c"%d,%d\0A\00", align 1

declare i32 @printf(ptr, ...)

define i32 @main() {
entry:
  %a = alloca i32, align 4
  store i32 12, ptr %a, align 4
  %b = alloca i1, align 1
  %r1 = load i32, ptr %a, align 4
  %r2 = icmp sgt i32 %r1, 11
  br label %or0.start

or0.start:                                        ; preds = %entry
  br i1 %r2, label %or0.exit, label %or0.check

or0.check:                                        ; preds = %or0.start
  %r5 = load i32, ptr %a, align 4
  %r6 = add i32 %r5, 1
  store i32 %r6, ptr %a, align 4
  %r7 = load i32, ptr %a, align 4
  %r8 = icmp eq i32 %r7, 12
  br label %or0.exit

or0.exit:                                         ; preds = %or0.check, %or0.start
  %r12 = phi i1 [ true, %or0.start ], [ %r8, %or0.check ]
  store i1 %r12, ptr %b, align 1
  %r15 = load i32, ptr %a, align 4
  %r16 = load i1, ptr %b, align 1
  %extend_reg_17 = zext i1 %r16 to i32
  %r14 = call i32 (ptr, ...) @printf(ptr @.constant_3, i32 %r15, i32 %extend_reg_17)
  ret i32 0
}
