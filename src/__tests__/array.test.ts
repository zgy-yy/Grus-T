import { describe, it, expect } from 'vitest';
import { compileAndRun } from './util';

describe('数组拷贝', () => {
  it('声明时用同形数组初始化应为深拷贝（改源不影响副本）', () => {
    const source = `
fun main() i32 {
  let [3]i32 a = [1, 2, 3];
  let [3]i32 b = a;
  a[0] = 99;
  printf("%d %d %d\\n", b[0], b[1], b[2]);
  return 0;
}
`;
    const output = compileAndRun(source);
    expect(output).toContain('1 2 99');
  });

  it('赋值同形数组应为整块拷贝', () => {
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
    const output = compileAndRun(source);
    expect(output).toContain('7 8');
  });

  it('应能通过 @[N]T 指针对数组下标读写', () => {
    const source = `
fun main() i32 {
  let [2]i32 a = [1, 2];
  let @[2]i32 p => a;
  p[1] = 42;
  printf("%d %d\\n", a[0], a[1]);
  return 0;
}
`;
    const output = compileAndRun(source);
    expect(output).toContain('1 42');
  });
});
