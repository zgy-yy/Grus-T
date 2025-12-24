; ModuleID = '/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll'
source_filename = "/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll"

@.constant_0 = private unnamed_addr constant [7 x i8] c"hello\0A\00" #0
@.constant_1 = private unnamed_addr constant [6 x i8] c"haha\0A\00" #0
@.constant_2 = private unnamed_addr constant [4 x i8] c"%s\0A\00" #0
@.a = global ptr @.constant_0

declare i32 @printf(ptr, ...)

define i32 @main() {
entry:
  store ptr @.constant_1, ptr @.a, align 8
  %val_reg_1 = load ptr, ptr @.a, align 8
  %val_reg_2 = bitcast ptr @printf to ptr
  %0 = call i32 (ptr, ...) %val_reg_2(ptr @.constant_2, ptr %val_reg_1)
  ret i32 0
}

attributes #0 = { align=1 }
