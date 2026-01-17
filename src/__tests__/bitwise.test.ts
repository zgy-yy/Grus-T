import { describe, it, expect } from 'vitest';
import { compileAndRun } from './util';

describe('位运算测试', () => {
  describe('按位与运算 (&)', () => {
    it('应该正确执行基本按位与运算', () => {
      const source = `
fun main() i32 {
  i32 x = 5 & 3;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      // 5 = 101, 3 = 011, 5 & 3 = 001 = 1
      expect(output).toContain('1');
    });

    it('应该正确执行按位与运算（全1）', () => {
      const source = `
fun main() i32 {
  i32 x = 15 & 15;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('15');
    });

    it('应该正确执行按位与运算（全0）', () => {
      const source = `
fun main() i32 {
  i32 x = 5 & 0;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
    });

    it('应该正确处理变量按位与运算', () => {
      const source = `
fun main() i32 {
  i32 a = 12;
  i32 b = 10;
  i32 x = a & b;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      // 12 = 1100, 10 = 1010, 12 & 10 = 1000 = 8
      expect(output).toContain('8');
    });

    it('应该正确处理大数按位与运算', () => {
      const source = `
fun main() i32 {
  i32 x = 255 & 240;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      // 255 = 11111111, 240 = 11110000, 255 & 240 = 11110000 = 240
      expect(output).toContain('240');
    });

    it('应该正确处理负数按位与运算', () => {
      const source = `
fun main() i32 {
  i32 x = -5 & 3;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      // -5 & 3 的结果取决于实现，通常是 3
      expect(output).toContain('3');
    });
  });

  describe('按位或运算 (|)', () => {
    it('应该正确执行基本按位或运算', () => {
      const source = `
fun main() i32 {
  i32 x = 5 | 3;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      // 5 = 101, 3 = 011, 5 | 3 = 111 = 7
      expect(output).toContain('7');
    });

    it('应该正确执行按位或运算（全1）', () => {
      const source = `
fun main() i32 {
  i32 x = 5 | 0;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('5');
    });

    it('应该正确执行按位或运算（全0）', () => {
      const source = `
fun main() i32 {
  i32 x = 0 | 0;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
    });

    it('应该正确处理变量按位或运算', () => {
      const source = `
fun main() i32 {
  i32 a = 12;
  i32 b = 10;
  i32 x = a | b;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      // 12 = 1100, 10 = 1010, 12 | 10 = 1110 = 14
      expect(output).toContain('14');
    });

    it('应该正确处理大数按位或运算', () => {
      const source = `
fun main() i32 {
  i32 x = 85 | 170;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      // 85 = 01010101, 170 = 10101010, 85 | 170 = 11111111 = 255
      expect(output).toContain('255');
    });

    it('应该正确处理负数按位或运算', () => {
      const source = `
fun main() i32 {
  i32 x = -5 | 3;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      // -5 | 3 的结果取决于实现
      expect(output).toContain('-5');
    });
  });

  describe('按位异或运算 (^)', () => {
    it('应该正确执行基本按位异或运算', () => {
      const source = `
fun main() i32 {
  i32 x = 5 ^ 3;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      // 5 = 101, 3 = 011, 5 ^ 3 = 110 = 6
      expect(output).toContain('6');
    });

    it('应该正确执行按位异或运算（相同数）', () => {
      const source = `
fun main() i32 {
  i32 x = 5 ^ 5;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
    });

    it('应该正确执行按位异或运算（与0）', () => {
      const source = `
fun main() i32 {
  i32 x = 5 ^ 0;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('5');
    });

    it('应该正确处理变量按位异或运算', () => {
      const source = `
fun main() i32 {
  i32 a = 12;
  i32 b = 10;
  i32 x = a ^ b;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      // 12 = 1100, 10 = 1010, 12 ^ 10 = 0110 = 6
      expect(output).toContain('6');
    });

    it('应该正确处理大数按位异或运算', () => {
      const source = `
fun main() i32 {
  i32 x = 255 ^ 240;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      // 255 = 11111111, 240 = 11110000, 255 ^ 240 = 00001111 = 15
      expect(output).toContain('15');
    });

    it('应该正确处理负数按位异或运算', () => {
      const source = `
fun main() i32 {
  i32 x = -5 ^ 3;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      // -5 ^ 3 的结果取决于实现
      expect(output).toContain('-8');
    });
  });

  describe('复合位运算表达式', () => {
    it('应该正确处理位运算的优先级', () => {
      const source = `
fun main() i32 {
  i32 x = 5 & 3 | 2;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      // (5 & 3) | 2 = 1 | 2 = 3
      expect(output).toContain('3');
    });

    it('应该正确处理括号中的位运算', () => {
      const source = `
fun main() i32 {
  i32 x = 5 & (3 | 2);
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      // 5 & (3 | 2) = 5 & 3 = 1
      expect(output).toContain('1');
    });

    it('应该正确处理链式位运算', () => {
      const source = `
fun main() i32 {
  i32 x = 5 & 3 & 1;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      // (5 & 3) & 1 = 1 & 1 = 1
      expect(output).toContain('1');
    });

    it('应该正确处理位运算与算术运算的组合', () => {
      const source = `
fun main() i32 {
  i32 x = (5 + 3) & (2 * 2);
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      // (5 + 3) & (2 * 2) = 8 & 4 = 0
      expect(output).toContain('0');
    });

    it('应该正确处理位运算与位移运算的组合', () => {
      const source = `
fun main() i32 {
  i32 x = (1 << 2) & 3;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      // (1 << 2) & 3 = 4 & 3 = 0
      expect(output).toContain('0');
    });
  });

  describe('位运算与变量', () => {
    it('应该正确处理变量之间的位运算', () => {
      const source = `
fun main() i32 {
  i32 a = 6;
  i32 b = 3;
  i32 x = a & b;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      // 6 = 110, 3 = 011, 6 & 3 = 010 = 2
      expect(output).toContain('2');
    });

    it('应该正确处理变量赋值后的位运算', () => {
      const source = `
fun main() i32 {
  i32 x = 5;
  x = x & 3;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
    });

    it('应该正确处理多个变量的位运算', () => {
      const source = `
fun main() i32 {
  i32 a = 12;
  i32 b = 10;
  i32 c = 6;
  i32 result = a & b | c;
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      // (12 & 10) | 6 = 8 | 6 = 14
      expect(output).toContain('14');
    });
  });

  describe('边界情况', () => {
    it('应该正确处理零值位运算', () => {
      const source = `
fun main() i32 {
  i32 x = 0 & 0;
  i32 y = 0 | 0;
  i32 z = 0 ^ 0;
  printf("%d\\n", x);
  printf("%d\\n", y);
  printf("%d\\n", z);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
      expect(output).toContain('0');
      expect(output).toContain('0');
    });

    it('应该正确处理全1位运算', () => {
      const source = `
fun main() i32 {
  i32 x = 255 & 255;
  i32 y = 255 | 255;
  i32 z = 255 ^ 255;
  printf("%d\\n", x);
  printf("%d\\n", y);
  printf("%d\\n", z);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('255');
      expect(output).toContain('255');
      expect(output).toContain('0');
    });

    it('应该正确处理大数位运算', () => {
      const source = `
fun main() i32 {
  i32 x = 65535 & 65280;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      // 65535 = 1111111111111111, 65280 = 1111111100000000
      // 65535 & 65280 = 1111111100000000 = 65280
      expect(output).toContain('65280');
    });
  });

  describe('i8类型位运算', () => {
    it('应该正确处理i8类型按位与运算', () => {
      const source = `
fun main() i32 {
  i8 a = 5;
  i8 b = 3;
  i32 x = a & b;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
    });

    it('应该正确处理i8类型按位或运算', () => {
      const source = `
fun main() i32 {
  i8 a = 5;
  i8 b = 3;
  i32 x = a | b;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('7');
    });

    it('应该正确处理i8类型按位异或运算', () => {
      const source = `
fun main() i32 {
  i8 a = 5;
  i8 b = 3;
  i32 x = a ^ b;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('6');
    });

    it('应该正确处理i8类型位运算后的截断', () => {
      const source = `
fun main() i32 {
  i8 a = 255;
  i8 b = 1;
  i8 c = a | b;
  printf("%d\\n", c);
  return 0;
}
`;
      const output = compileAndRun(source);
      // 255 | 1 = 255, 但 i8 只能存储 -128 到 127，所以是 -1
      expect(output).toContain('-1');
    });
  });

  describe('复杂位运算表达式', () => {
    it('应该正确处理嵌套的位运算', () => {
      const source = `
fun main() i32 {
  i32 x = (5 & 3) | (2 ^ 1);
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      // (5 & 3) | (2 ^ 1) = 1 | 3 = 3
      expect(output).toContain('3');
    });

    it('应该正确处理位运算与乘除法的组合', () => {
      const source = `
fun main() i32 {
  i32 x = (8 & 4) * 2;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      // (8 & 4) * 2 = 0 * 2 = 0
      expect(output).toContain('0');
    });

    it('应该正确处理位运算与取模的组合', () => {
      const source = `
fun main() i32 {
  i32 x = (10 & 6) % 3;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      // (10 & 6) % 3 = 2 % 3 = 2
      expect(output).toContain('2');
    });

    it('应该正确处理多层嵌套的位运算表达式', () => {
      const source = `
fun main() i32 {
  i32 x = ((5 & 3) | (2 ^ 1)) & 7;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      // ((5 & 3) | (2 ^ 1)) & 7 = (1 | 3) & 7 = 3 & 7 = 3
      expect(output).toContain('3');
    });

    it('应该正确处理位运算与比较运算的组合', () => {
      const source = `
fun main() i32 {
  bool x = (5 & 3) > 0;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      // (5 & 3) > 0 = 1 > 0 = 1
      expect(output).toContain('1');
    });
  });

  describe('位运算的常用模式', () => {
    it('应该正确处理清除特定位', () => {
      const source = `
fun main() i32 {
  i32 x = 15;
  i32 mask = 12;
  i32 result = x & ~mask;
  printf("%d\\n", result);
  return 0;
}
`;
      // 注意：如果 ~ 未实现，这个测试会失败
      const output = compileAndRun(source);
      // 15 = 1111, mask = 1100, ~mask = 0011, 15 & ~mask = 0011 = 3
      // 如果 ~ 未实现，这个测试可能需要调整
      expect(output).toContain('3');
    });

    it('应该正确处理设置特定位', () => {
      const source = `
fun main() i32 {
  i32 x = 5;
  i32 mask = 2;
  i32 result = x | mask;
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      // 5 = 101, mask = 010, 5 | mask = 111 = 7
      expect(output).toContain('7');
    });

    it('应该正确处理切换特定位', () => {
      const source = `
fun main() i32 {
  i32 x = 5;
  i32 mask = 2;
  i32 result = x ^ mask;
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      // 5 = 101, mask = 010, 5 ^ mask = 111 = 7
      expect(output).toContain('7');
    });

    it('应该正确处理检查特定位', () => {
      const source = `
fun main() i32 {
  i32 x = 5;
  i32 mask = 4;
  bool result = (x & mask) != 0;
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      // 5 = 101, mask = 100, 5 & mask = 100 != 0 = 1
      expect(output).toContain('1');
    });
  });
});

