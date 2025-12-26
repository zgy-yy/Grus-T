; ModuleID = '/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll'
source_filename = "/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll"

@.constant_2 = private unnamed_addr constant [4 x i8] c"%d\0A\00", align 1

declare i32 @printf(ptr, ...)

define i32 @main() {
entry:
  %bin_reg_0 = add i32 10, 5
  %unary_reg_2 = sub i32 0, %bin_reg_0
  %x = alloca i32, align 4
  store i32 %unary_reg_2, ptr %x, align 4
  %val_reg_5 = load i32, ptr %x, align 4
  %call_reg_4 = call i32 (ptr, ...) @printf(ptr @.constant_2, i32 %val_reg_5)
  ret i32 0
}
