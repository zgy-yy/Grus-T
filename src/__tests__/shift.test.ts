import { describe, it, expect } from 'vitest';
import { compileAndRun } from './util';

describe('位移运算测试', () => {
  describe('左移运算 (<<)', () => {
    it('应该正确执行基本左移运算', () => {
      const source = `
fun main() i32 {
  i32 x = 1 << 2;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('4');
    });

    it('应该正确执行左移10位', () => {
      const source = `
fun main() i32 {
  i32 x = 1 << 10;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1024');
    });

    it('应该正确执行左移0位', () => {
      const source = `
fun main() i32 {
  i32 x = 5 << 0;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('5');
    });

    it('应该正确执行左移1位', () => {
      const source = `
fun main() i32 {
  i32 x = 3 << 1;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('6');
    });

    it('应该正确处理变量左移', () => {
      const source = `
fun main() i32 {
  i32 a = 2;
  i32 b = 3;
  i32 x = a << b;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('16');
    });

    it('应该正确处理大数左移', () => {
      const source = `
fun main() i32 {
  i32 x = 100 << 2;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('400');
    });

    it('应该正确处理负数左移', () => {
      const source = `
fun main() i32 {
  i32 x = -5 << 2;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('-20');
    });
  });

  describe('右移运算 (>>)', () => {
    it('应该正确执行基本右移运算', () => {
      const source = `
fun main() i32 {
  i32 x = 8 >> 2;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('2');
    });

    it('应该正确执行右移1位', () => {
      const source = `
fun main() i32 {
  i32 x = 10 >> 1;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('5');
    });

    it('应该正确执行右移0位', () => {
      const source = `
fun main() i32 {
  i32 x = 7 >> 0;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('7');
    });

    it('应该正确处理变量右移', () => {
      const source = `
fun main() i32 {
  i32 a = 16;
  i32 b = 2;
  i32 x = a >> b;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('4');
    });

    it('应该正确处理大数右移', () => {
      const source = `
fun main() i32 {
  i32 x = 1024 >> 3;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('128');
    });

    it('应该正确处理负数右移（算术右移）', () => {
      const source = `
fun main() i32 {
  i32 x = -8 >> 2;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('-2');
    });

    it('应该正确处理右移导致结果为0', () => {
      const source = `
fun main() i32 {
  i32 x = 3 >> 5;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
    });
  });

  describe('位移运算与类型', () => {
    it('应该正确处理i8类型的左移', () => {
      const source = `
fun main() i32 {
  i8 x = 1;
  i8 a = x << 2;
  printf("%d\\n", a);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('4');
    });

    it('应该正确处理i8类型的右移', () => {
      const source = `
fun main() i32 {
  i8 x = 8;
  i8 a = x >> 2;
  printf("%d\\n", a);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('2');
    });

    it('应该正确处理i8类型左移后的截断', () => {
      const source = `
fun main() i32 {
  i8 x = 1;
  i8 a = x << 10;
  printf("%d\\n", a);
}
`;
      const output = compileAndRun(source);
      // 1024 & 0xFF = 0
      expect(output).toContain('0');
    });
  });

  describe('复合位移表达式', () => {
    it('应该正确处理位移运算的优先级', () => {
      const source = `
fun main() i32 {
  i32 x = 2 << 1 + 1;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      // 2 << (1 + 1) = 2 << 2 = 8
      expect(output).toContain('8');
    });

    it('应该正确处理括号中的位移运算', () => {
      const source = `
fun main() i32 {
  i32 x = (2 << 1) + 1;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      // (2 << 1) + 1 = 4 + 1 = 5
      expect(output).toContain('5');
    });

    it('应该正确处理位移与乘法的组合', () => {
      const source = `
fun main() i32 {
  i32 x = 2 << 2 * 2;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      // 2 << (2 * 2) = 2 << 4 = 32
      expect(output).toContain('32');
    });

    it('应该正确处理链式左移', () => {
      const source = `
fun main() i32 {
  i32 x = 1 << 2 << 1;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      // (1 << 2) << 1 = 4 << 1 = 8
      expect(output).toContain('8');
    });

    it('应该正确处理链式右移', () => {
      const source = `
fun main() i32 {
  i32 x = 32 >> 2 >> 1;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      // (32 >> 2) >> 1 = 8 >> 1 = 4
      expect(output).toContain('4');
    });

    it('应该正确处理位移与加减法的组合', () => {
      const source = `
fun main() i32 {
  i32 x = 4 << 2 + 8 >> 2;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      // 4 << (2 + 8) >> 2 = (4 << 10) >> 2 = 4096 >> 2 = 1024
      expect(output).toContain('1024');
    });
  });

  describe('位移运算与变量', () => {
    it('应该正确处理变量之间的位移运算', () => {
      const source = `
fun main() i32 {
  i32 a = 4;
  i32 b = 2;
  i32 x = a << b;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('16');
    });

    it('应该正确处理变量赋值后的位移运算', () => {
      const source = `
fun main() i32 {
  i32 x = 2;
  x = x << 3;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('16');
    });

    it('应该正确处理多个变量的位移运算', () => {
      const source = `
fun main() i32 {
  i32 a = 2;
  i32 b = 3;
  i32 c = 4;
  i32 result = a << b >> c;
  printf("%d\\n", result);
}
`;
      const output = compileAndRun(source);
      // (2 << 3) >> 4 = 16 >> 4 = 1
      expect(output).toContain('1');
    });
  });

  describe('边界情况', () => {
    it('应该正确处理零值左移', () => {
      const source = `
fun main() i32 {
  i32 x = 0 << 5;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
    });

    it('应该正确处理零值右移', () => {
      const source = `
fun main() i32 {
  i32 x = 0 >> 5;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
    });

    it('应该正确处理大位移量', () => {
      const source = `
fun main() i32 {
  i32 x = 1 << 20;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1048576');
    });
  });

  describe('复杂位移表达式', () => {
    it('应该正确处理嵌套的位移运算', () => {
      const source = `
fun main() i32 {
  i32 x = (1 << 2) << 3;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      // (1 << 2) << 3 = 4 << 3 = 32
      expect(output).toContain('32');
    });

    it('应该正确处理位移与乘除法的组合', () => {
      const source = `
fun main() i32 {
  i32 x = 8 << 2 / 2;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      // 8 << (2 / 2) = 8 << 1 = 16
      expect(output).toContain('16');
    });

    it('应该正确处理位移与取模的组合', () => {
      const source = `
fun main() i32 {
  i32 x = 16 >> 2 % 3;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      // 16 >> (2 % 3) = 16 >> 2 = 4
      expect(output).toContain('4');
    });

    it('应该正确处理包含位移的复杂表达式', () => {
      const source = `
fun main() i32 {
  i32 x = (2 << 3) + (8 >> 2) - (1 << 1);
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      // (2 << 3) + (8 >> 2) - (1 << 1) = 16 + 2 - 2 = 16
      expect(output).toContain('16');
    });

    it('应该正确处理多层嵌套的位移表达式', () => {
      const source = `
fun main() i32 {
  i32 x = ((1 << 2) << 1) >> 1;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      // ((1 << 2) << 1) >> 1 = (4 << 1) >> 1 = 8 >> 1 = 4
      expect(output).toContain('4');
    });
  });
});

