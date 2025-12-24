; ModuleID = '/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll'
source_filename = "/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll"

@.constant_1 = private unnamed_addr constant [4 x i8] c"%f\0A\00" #0

declare i32 @printf(ptr, ...)

define i32 @main() {
entry:
  %unary_reg_0 = sub i32 0, 13
  %b = alloca float, align 4
  %turn_reg_1 = sitofp i32 %unary_reg_0 to float
  store float %turn_reg_1, ptr %b, align 4
  %val_reg_3 = load float, ptr %b, align 4
  %val_reg_4 = bitcast ptr @printf to ptr
  %0 = call i32 (ptr, ...) %val_reg_4(ptr @.constant_1, float %val_reg_3)
  ret i32 0
}

attributes #0 = { align=1 }
