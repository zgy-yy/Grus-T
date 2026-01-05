; ModuleID = '/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll'
source_filename = "/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll"

@.constant_2 = private unnamed_addr constant [4 x i8] c"%d\0A\00", align 1

declare i32 @printf(ptr, ...)

define i32 @main() {
entry:
  %x = alloca i32, align 4
  store i32 15, ptr %x, align 4
  %mask = alloca i32, align 4
  store i32 12, ptr %mask, align 4
  %val_reg_2 = load i32, ptr %x, align 4
  %val_reg_3 = load i32, ptr %mask, align 4
  %unary_reg_4 = xor i32 %val_reg_3, -1
  %bin_reg_5 = and i32 %val_reg_2, %unary_reg_4
  %result = alloca i32, align 4
  store i32 %bin_reg_5, ptr %result, align 4
  %val_reg_9 = load i32, ptr %result, align 4
  %call_reg_8 = call i32 (ptr, ...) @printf(ptr @.constant_2, i32 %val_reg_9)
  ret i32 0
}
