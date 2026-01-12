; ModuleID = '/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll'
source_filename = "/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll"

@.constant_2 = private unnamed_addr constant [15 x i8] c"negative true\0A\00", align 1
@.constant_5 = private unnamed_addr constant [4 x i8] c"44\0A\00", align 1
@.constant_6 = private unnamed_addr constant [7 x i8] c"false\0A\00", align 1

declare i32 @printf(ptr, ...)

define i32 @main() {
entry:
  %x = alloca i32, align 4
  store i32 23, ptr %x, align 4
  %r9 = icmp ne i32 0, 0
  br i1 %r9, label %if1.then, label %if1.else

if1.then:                                         ; preds = %entry
  %r1 = call i32 (ptr, ...) @printf(ptr @.constant_2)
  br label %if1.end

if1.else:                                         ; preds = %entry
  %x1 = alloca i32, align 4
  store i32 23, ptr %x1, align 4
  %r3 = load i32, ptr %x1, align 4
  %r4 = icmp slt i32 %r3, 44
  %r7 = icmp ne i1 %r4, false
  br i1 %r7, label %if0.then, label %if0.else

if0.then:                                         ; preds = %if1.else
  %r6 = call i32 (ptr, ...) @printf(ptr @.constant_5)
  br label %if0.end

if0.else:                                         ; preds = %if1.else
  br label %if0.end

if0.end:                                          ; preds = %if0.else, %if0.then
  %r8 = call i32 (ptr, ...) @printf(ptr @.constant_6)
  br label %if1.end

if1.end:                                          ; preds = %if0.end, %if1.then
  ret i32 0
}
