; ModuleID = '/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll'
source_filename = "/Users/tal/Desktop/Grus-T/src/llvm ir/temp-ir.ll"

@.constant_1 = private unnamed_addr constant [4 x i8] c"ok\0A\00", align 1

declare i32 @printf(ptr, ...)

define i1 @isTrue() {
entry:
  ret i1 true

0:                                                ; No predecessors!
  ret i1 false
}

define i32 @main() {
entry:
  %r0 = call i1 @isTrue()
  br label %and0.start

and0.start:                                       ; preds = %entry
  br i1 %r0, label %and0.check, label %and0.exit

and0.check:                                       ; preds = %and0.start
  %r1 = call i1 @isFalse()
  %r2 = xor i1 %r1, true
  br label %and0.exit

and0.exit:                                        ; preds = %and0.check, %and0.start
  %r4 = phi i1 [ false, %and0.start ], [ %r2, %and0.check ]
  br i1 %r4, label %if0.then, label %if0.else

if0.then:                                         ; preds = %and0.exit
  %r5 = call i32 (ptr, ...) @printf(ptr @.constant_1)
  br label %if0.end

if0.else:                                         ; preds = %and0.exit
  br label %if0.end

if0.end:                                          ; preds = %if0.else, %if0.then
  ret i32 0

0:                                                ; No predecessors!
  ret i32 0
}

define i1 @isFalse() {
entry:
  ret i1 false

0:                                                ; No predecessors!
  ret i1 false
}
