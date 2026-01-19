; ModuleID = '/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll'
source_filename = "/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll"

@.constant_6 = private unnamed_addr constant [4 x i8] c"%d\0A\00", align 1

declare i32 @printf(ptr, ...)

define i32 @foo() {
entry:
  br i1 true, label %if1.then, label %if1.else

if1.then:                                         ; preds = %entry
  ret i32 2

0:                                                ; No predecessors!
  br i1 false, label %if0.then, label %if0.else

if0.then:                                         ; preds = %0
  ret i32 23

1:                                                ; No predecessors!
  br label %if0.end

if0.else:                                         ; preds = %0
  ret i32 23

2:                                                ; No predecessors!
  br label %if0.end

if0.end:                                          ; preds = %2, %1
  br label %if1.end

if1.else:                                         ; preds = %entry
  ret i32 1

3:                                                ; No predecessors!
  br label %if1.end

if1.end:                                          ; preds = %3, %if0.end
  ret i32 0
}

define i32 @main() {
entry:
  %r0 = call i32 (ptr, ...) @printf(ptr @.constant_6, i32 1)
  ret i32 0

0:                                                ; No predecessors!
  ret i32 0
}
