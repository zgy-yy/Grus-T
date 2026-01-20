; ModuleID = '/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll'
source_filename = "/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll"

@.constant_0 = private unnamed_addr constant [6 x i8] c"a,%d\0A\00", align 1
@.constant_3 = private unnamed_addr constant [4 x i8] c"%d\0A\00", align 1

declare i32 @printf(ptr, ...)

define i32 @foo(i32 %a) {
entry:
  %a.addr = alloca i32, align 4
  store i32 %a, ptr %a.addr, align 4
  %r1 = load i32, ptr %a.addr, align 4
  %r0 = call i32 (ptr, ...) @printf(ptr @.constant_0, i32 %r1)
  ret i32 23

0:                                                ; No predecessors!
  ret i32 0
}

define i32 @main() {
entry:
  %a = alloca i32, align 4
  %r2 = call i32 @foo(i32 2)
  store i32 %r2, ptr %a, align 4
  %r5 = load i32, ptr %a, align 4
  %r4 = call i32 (ptr, ...) @printf(ptr @.constant_3, i32 %r5)
  ret i32 0

0:                                                ; No predecessors!
  ret i32 0
}
