import { describe, it, expect } from 'vitest';
import { compileAndRun } from './util';

describe('数组', () => {
  describe('字面量与下标', () => {
    it('应用字面量初始化并按下标读取', () => {
      const source = `
fun main() i32 {
  let [4]i32 arr = [1, 2, 3, 4];
  printf("%d %d %d %d\\n", arr[0], arr[1], arr[2], arr[3]);
  return 0;
}
`;
      expect(compileAndRun(source)).toContain('1 2 3 4');
    });

    it('应能通过下标修改元素', () => {
      const source = `
fun main() i32 {
  let [3]i32 arr = [0, 0, 0];
  arr[1] = 7;
  printf("%d %d %d\\n", arr[0], arr[1], arr[2]);
  return 0;
}
`;
      expect(compileAndRun(source)).toContain('0 7 0');
    });

    it('无显式元素类型时可由字面量推断数组类型与长度', () => {
      const source = `
fun main() i32 {
  let a = [10, 20, 30];
  printf("%d\\n", a[1]);
  return 0;
}
`;
      expect(compileAndRun(source)).toContain('20');
    });
  });

  describe('引用拷贝', () => {
    it('声明时用另一数组初始化应共享同一底层数据', () => {
      const source = `
fun main() i32 {
  let [3]i32 a = [1, 2, 3];
  let [3]i32 b = a;
  a[0] = 99;
  printf("%d %d %d\\n", b[0], b[1], b[2]);
  return 0;
}
`;
      expect(compileAndRun(source)).toContain('99 2 3');
    });

    it('赋值同长数组后应共享引用，改源会影响目标', () => {
      const source = `
fun main() i32 {
  let [2]i32 a = [7, 8];
  let [2]i32 b = [0, 0];
  b = a;
  a[0] = 100;
  printf("%d %d\\n", b[0], b[1]);
  return 0;
}
`;
      expect(compileAndRun(source)).toContain('100 8');
    });
  });

  describe('指向数组的指针 @[N]T', () => {
    it('指针与原数组别名，改原数组后通过指针下标应读到同一数据', () => {
      const source = `
fun main() i32 {
  let [2]i32 a = [1, 2];
  let @[2]i32 p => a;
  a[1] = 42;
  printf("%d %d\\n", p[0], p[1]);
  return 0;
}
`;
      expect(compileAndRun(source)).toContain('1 42');
    });

    it('读取指针下标应得到当前元素值', () => {
      const source = `
fun main() i32 {
  let [3]i32 a = [5, 6, 7];
  let @[3]i32 p => a;
  printf("%d\\n", p[2]);
  return 0;
}
`;
      expect(compileAndRun(source)).toContain('7');
    });
  });

  describe('与循环', () => {
    it('应用 for 遍历下标累加', () => {
      const source = `
fun main() i32 {
  let [4]i32 arr = [1, 2, 3, 4];
  let i32 sum = 0;
  let i32 i = 0;
  for (i = 0; i < 4; i = i + 1) {
    sum = sum + arr[i];
  }
  printf("%d\\n", sum);
  return 0;
}
`;
      expect(compileAndRun(source)).toContain('10');
    });
  });
});
