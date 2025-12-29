; ModuleID = '/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll'
source_filename = "/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll"

@.constant_1 = private unnamed_addr constant [4 x i8] c"%d\0A\00", align 1

declare i32 @printf(ptr, ...)

define i32 @main() {
entry:
  %x = alloca i8, align 1
  %turn_reg_0 = zext i1 false to i8
  store i8 %turn_reg_0, ptr %x, align 1
  %val_reg_2 = load i8, ptr %x, align 1
  %extend_reg_3 = sext i8 %val_reg_2 to i32
  %call_reg_1 = call i32 (ptr, ...) @printf(ptr @.constant_1, i32 %extend_reg_3)
  ret i32 0
}
