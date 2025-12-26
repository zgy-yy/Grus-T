; ModuleID = '/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll'
source_filename = "/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll"

@.constant_1 = private unnamed_addr constant [4 x i8] c"%f\0A\00", align 1
@.a = global i32 0

declare i32 @printf(ptr, ...)

define i32 @main() {
entry:
  %b = alloca float, align 4
  %turn_reg_0 = sitofp i32 23 to float
  store float %turn_reg_0, ptr %b, align 4
  %val_reg_1 = load float, ptr %b, align 4
  %val_reg_2 = load i32, ptr @.a, align 4
  %turn_reg_4 = sitofp i32 %val_reg_2 to float
  %bin_reg_3 = fdiv float %val_reg_1, %turn_reg_4
  store float %bin_reg_3, ptr %b, align 4
  %val_reg_6 = load float, ptr %b, align 4
  %call_reg_5 = call i32 (ptr, ...) @printf(ptr @.constant_1, float %val_reg_6)
  ret i32 0
}
