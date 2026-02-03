; ModuleID = 'demo_module'
source_filename = "demo_module"

@0 = private unnamed_addr constant [5 x i8] c"%d\\n\00", align 1

declare i32 @printf(i8*, ...)

define i32 @main() {
entry:
  %a = alloca i32, align 4
  store i32 12, i32* %a, align 4
  %a1 = load i32, i32* %a, align 4
  %0 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([5 x i8], [5 x i8]* @0, i32 0, i32 0), i32 %a1)
  ret i32 0
}
