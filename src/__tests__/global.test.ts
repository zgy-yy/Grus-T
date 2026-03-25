import { describe, it, expect } from 'vitest';
import { compileAndRun } from './util';

/**
 * 全局变量：IR 中为 GlobalVariable，当前实现在进入 main 入口时对未编译的初始化表达式求值并 store。
 *
 * 未覆盖（编译器/语义限制）：float/double 全局、数组/结构体全局、在其它函数内对全局赋值并期望持久化等。
 */
describe('全局变量', () => {
  describe('整数类型', () => {
    it('i32 字面量初始化并在 main 中读取', () => {
      const source = `
let i32 g = 42;
fun main() i32 {
  printf("%d\\n", g);
  return 0;
}
`;
      expect(compileAndRun(source)).toContain('42');
    });

    it('i8 全局变量', () => {
      const source = `
let i8 g = 7;
fun main() i32 {
  printf("%d\\n", g);
  return 0;
}
`;
      expect(compileAndRun(source)).toContain('7');
    });

    it('i16 全局变量', () => {
      const source = `
let i16 g = 300;
fun main() i32 {
  printf("%d\\n", g);
  return 0;
}
`;
      expect(compileAndRun(source)).toContain('300');
    });

    it('i64 全局变量', () => {
      const source = `
let i64 g = 1000;
fun main() i32 {
  printf("%d\\n", g);
  return 0;
}
`;
      expect(compileAndRun(source)).toContain('1000');
    });

    it('无显式类型时由初始化表达式推断', () => {
      const source = `
let g = 99;
fun main() i32 {
  printf("%d\\n", g);
  return 0;
}
`;
      expect(compileAndRun(source)).toContain('99');
    });
  });

  describe('声明顺序与表达式初始化', () => {
    it('后声明的全局可引用先声明的全局', () => {
      const source = `
let i32 b = 23;
let i32 a = 1 + b;
fun main() i32 {
  printf("%d\\n", a);
  return 0;
}
`;
      expect(compileAndRun(source)).toContain('24');
    });

    it('同一条 let 中多个带共享类型说明的全局', () => {
      const source = `
let i32 x = 10, y = 20;
fun main() i32 {
  printf("%d %d\\n", x, y);
  return 0;
}
`;
      expect(compileAndRun(source)).toContain('10 20');
    });
  });

  describe('与 main 局部作用域', () => {
    it('main 内局部变量可遮蔽全局同名变量', () => {
      const source = `
let i32 a = 100;
fun main() i32 {
  let i32 a = 7;
  printf("%d\\n", a);
  return 0;
}
`;
      expect(compileAndRun(source)).toContain('7');
    });
  });

  describe('布尔', () => {
    it('bool 全局为真时按整数打印', () => {
      const source = `
let bool flag = true;
fun main() i32 {
  printf("%d\\n", flag);
  return 0;
}
`;
      const out = compileAndRun(source);
      expect(out === '1' || out.includes('1')).toBe(true);
    });
  });

  describe('多函数共享', () => {
    it('其它函数可读取全局（只读）', () => {
      const source = `
let i32 counter = 5;
fun printGlobal() void {
  printf("%d\\n", counter);
}
fun main() i32 {
  printGlobal();
  return 0;
}
`;
      expect(compileAndRun(source)).toContain('5');
    });
  });
});
