import { describe, it, expect } from 'vitest';
import { compileAndRun } from './util';

/**
 * 结构体字段在 Resolver 里按名字排序；字面量字段顺序须与排序后一致（如 x 在 y 前）。
 */
describe('结构体', () => {
  describe('声明与字面量', () => {
    it('应能声明结构体并用字面量初始化', () => {
      const source = `
struct Point {
  i32 x, y;
}

fun main() i32 {
  let Point p = { x: 11, y: 22 };
  printf("%d\\n", p.x);
  printf("%d\\n", p.y);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('11');
      expect(output).toContain('22');
    });

    it('应支持从字面量推断结构体变量类型', () => {
      const source = `
fun main() i32 {
  let p = { a: 5, b: 7 };
  printf("%d\\n", p.a);
  printf("%d\\n", p.b);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('5');
      expect(output).toContain('7');
    });

    it('应支持多类型字段', () => {
      const source = `
struct Data {
  i32 n;
  i8 c;
}

fun main() i32 {
  let Data d = { n: 100, c: <i8>9 };
  printf("%d\\n", d.n);
  printf("%d\\n", d.c);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('100');
      expect(output).toContain('9');
    });
  });

  describe('字段访问与赋值', () => {
    it('应能对结构体字段赋值', () => {
      const source = `
struct Box {
  i32 v;
}

fun main() i32 {
  let Box b = { v: 1 };
  b.v = 99;
  printf("%d\\n", b.v);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('99');
    });

    it('应能修改多个字段', () => {
      const source = `
struct S {
  i32 x, y;
}

fun main() i32 {
  let S s = { x: 0, y: 0 };
  s.x = 3;
  s.y = 8;
  printf("%d\\n", s.x);
  printf("%d\\n", s.y);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('3');
      expect(output).toContain('8');
    });
  });

  describe('结构体与函数', () => {
    it('应能将结构体作为参数并访问字段', () => {
      const source = `
struct Pair {
  i32 a, b;
}

fun sum(Pair p) i32 {
  return p.a + p.b;
}

fun main() i32 {
  let Pair p = { a: 12, b: 30 };
  let i32 r = sum(p);
  printf("%d\\n", r);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('42');
    });
  });

  describe('结构体与指针', () => {
    it('应支持指向结构体的指针 @Point 并读写字段', () => {
      const source = `
struct Point {
  i32 x, y;
}

fun main() i32 {
  let Point p = { x: 1, y: 2 };
  let @Point rp => p;
  printf("%d\\n", rp.x);
  rp.x = 50;
  printf("%d\\n", p.x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
      expect(output).toContain('50');
    });

    it('应支持结构体中含 @i32 字段，字面量用 :> 取地址', () => {
      const source = `
struct Holder {
  i32 n;
  @i32 p;
}

fun main() i32 {
  let i32 v = 88;
  let @i32 pv => v;
  let Holder h = { n: 0, p:> pv };
  printf("%d\\n", h.n);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
    });

    it('应能通过含指针字段的结构体间接修改目标变量', () => {
      const source = `
struct Ref {
  @i32 z;
}

fun bump(Ref r) void {
  r.z = r.z + 10;
}

fun main() i32 {
  let i32 x = 5;
  let @i32 px => x;
  let Ref r = { z:> px };
  bump(r);
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('15');
    });

    it('应支持以 @Struct 为参数在函数内修改原结构体', () => {
      const source = `
struct Box {
  i32 v;
}

fun setViaPtr(@Box b) void {
  b.v = 200;
}

fun main() i32 {
  let Box t = { v: 0 };
  let @Box bp => t;
  setViaPtr(bp);
  printf("%d\\n", t.v);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('200');
    });
  });
});
