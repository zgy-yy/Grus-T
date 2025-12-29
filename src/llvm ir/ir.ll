; ModuleID = '/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll'
source_filename = "/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll"

@.constant_2 = private unnamed_addr constant [4 x i8] c"%d\0A\00", align 1

declare i32 @printf(ptr, ...)

define i32 @main() {
entry:
  %x = alloca i8, align 1
  %turn_reg_0 = trunc i32 1 to i8
  store i8 %turn_reg_0, ptr %x, align 1
  %val_reg_1 = load i8, ptr %x, align 1
  %turn_reg_3 = sext i8 %val_reg_1 to i32
  %bin_reg_2 = shl i32 %turn_reg_3, 10
  %a = alloca i8, align 1
  %turn_reg_4 = trunc i32 %bin_reg_2 to i8
  store i8 %turn_reg_4, ptr %a, align 1
  %val_reg_6 = load i8, ptr %a, align 1
  %call_reg_5 = call i32 (ptr, ...) @printf(ptr @.constant_2, i8 %val_reg_6)
  ret i32 0
}
