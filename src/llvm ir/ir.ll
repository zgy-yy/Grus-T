; ModuleID = '/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll'
source_filename = "/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll"

@.constant_3 = private unnamed_addr constant [15 x i8] c"negative true\0A\00", align 1
@.constant_6 = private unnamed_addr constant [4 x i8] c"44\0A\00", align 1
@.constant_7 = private unnamed_addr constant [7 x i8] c"false\0A\00", align 1

declare i32 @printf(ptr, ...)

define i32 @main() {
entry:
  %x = alloca i32, align 4
  store i32 23, ptr %x, align 4
  %y = alloca i32, align 4
  store i32 23, ptr %y, align 4
  %r10 = icmp ne i32 0, 0
  br i1 %r10, label %if1.then, label %if1.else

if1.then:                                         ; preds = %entry
  %r2 = call i32 (ptr, ...) @printf(ptr @.constant_3)
  br label %if1.end

if1.else:                                         ; preds = %entry
  %x1 = alloca i32, align 4
  store i32 23, ptr %x1, align 4
  %r4 = load i32, ptr %x1, align 4
  %r5 = icmp slt i32 %r4, 44
  %r8 = icmp ne i1 %r5, false
  br i1 %r8, label %if0.then, label %if0.else

if0.then:                                         ; preds = %if1.else
  %r7 = call i32 (ptr, ...) @printf(ptr @.constant_6)
  br label %if0.end

if0.else:                                         ; preds = %if1.else
  br label %if0.end

if0.end:                                          ; preds = %if0.else, %if0.then
  %r9 = call i32 (ptr, ...) @printf(ptr @.constant_7)
  br label %if1.end

if1.end:                                          ; preds = %if0.end, %if1.then
  ret i32 0
}
