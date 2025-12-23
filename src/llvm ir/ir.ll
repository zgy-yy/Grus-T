@.a = global i32 23;
define i32 @main() {
        entry:
        store i32 23, i32* @.a
        ret i32 0
       }