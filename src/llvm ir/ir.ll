; ModuleID = 'src/llvm ir/ir.ll'
source_filename = "src/llvm ir/ir.ll"

@.constant_2 = private unnamed_addr constant [4 x i8] c"%d\0A\00" #0
@.a = global i32 23

declare i32 @printf(ptr, ...)

define i32 @main() {
entry:
  store i32 23, ptr @.a, align 4
  %str_reg_1 = getelementptr inbounds [4 x i8], ptr @.constant_2, i32 0, i32 0
  %val_reg_2 = load i32, ptr @.a, align 4
  %val_reg_3 = bitcast ptr @printf to ptr
  %0 = call i32 (ptr, ...) %val_reg_3(ptr %str_reg_1, i32 %val_reg_2)
  ret i32 0
}

attributes #0 = { align=1 }
