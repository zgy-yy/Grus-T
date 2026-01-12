import { describe, it, expect } from 'vitest';
import { compileAndRun } from './util';

describe('比较运算测试', () => {
  describe('等于运算 (==)', () => {
    it('应该正确执行整数相等比较（true）', () => {
      const source = `
fun main() i32 {
  bool x = 5 == 5;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
    });

    it('应该正确执行整数相等比较（false）', () => {
      const source = `
fun main() i32 {
  bool x = 5 == 3;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
    });

    it('应该正确处理变量相等比较', () => {
      const source = `
fun main() i32 {
  i32 a = 10;
  i32 b = 10;
  bool x = a == b;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
    });

    it('应该正确处理浮点数相等比较', () => {
      const source = `
fun main() i32 {
  bool x = 3.5 == 3.5;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
    });

    it('应该正确处理零值相等比较', () => {
      const source = `
fun main() i32 {
  bool x = 0 == 0;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
    });
  });

  describe('不等于运算 (!=)', () => {
    it('应该正确执行整数不等比较（true）', () => {
      const source = `
fun main() i32 {
  bool x = 5 != 3;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
    });

    it('应该正确执行整数不等比较（false）', () => {
      const source = `
fun main() i32 {
  bool x = 5 != 5;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
    });

    it('应该正确处理变量不等比较', () => {
      const source = `
fun main() i32 {
  i32 a = 10;
  i32 b = 20;
  bool x = a != b;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
    });

    it('应该正确处理浮点数不等比较', () => {
      const source = `
fun main() i32 {
  bool x = 3.5 != 2.5;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
    });
  });

  describe('大于运算 (>)', () => {
    it('应该正确执行整数大于比较（true）', () => {
      const source = `
fun main() i32 {
  bool x = 10 > 5;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
    });

    it('应该正确执行整数大于比较（false）', () => {
      const source = `
fun main() i32 {
  bool x = 5 > 10;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
    });

    it('应该正确处理相等时不大于', () => {
      const source = `
fun main() i32 {
  bool x = 5 > 5;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
    });

    it('应该正确处理变量大于比较', () => {
      const source = `
fun main() i32 {
  i32 a = 20;
  i32 b = 10;
  bool x = a > b;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
    });

    it('应该正确处理浮点数大于比较', () => {
      const source = `
fun main() i32 {
  bool x = 5.0 > 3.0;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
    });

    it('应该正确处理负数大于比较', () => {
      const source = `
fun main() i32 {
  bool x = -5 > -10;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
    });
  });

  describe('大于等于运算 (>=)', () => {
    it('应该正确执行整数大于等于比较（大于）', () => {
      const source = `
fun main() i32 {
  bool x = 10 >= 5;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
    });

    it('应该正确执行整数大于等于比较（等于）', () => {
      const source = `
fun main() i32 {
  bool x = 5 >= 5;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
    });

    it('应该正确执行整数大于等于比较（false）', () => {
      const source = `
fun main() i32 {
  bool x = 5 >= 10;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
    });

    it('应该正确处理变量大于等于比较', () => {
      const source = `
fun main() i32 {
  i32 a = 15;
  i32 b = 15;
  bool x = a >= b;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
    });

    it('应该正确处理浮点数大于等于比较', () => {
      const source = `
fun main() i32 {
  bool x = 5.0 >= 5.0;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
    });
  });

  describe('小于运算 (<)', () => {
    it('应该正确执行整数小于比较（true）', () => {
      const source = `
fun main() i32 {
  bool x = 5 < 10;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
    });

    it('应该正确执行整数小于比较（false）', () => {
      const source = `
fun main() i32 {
  bool x = 10 < 5;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
    });

    it('应该正确处理相等时不小于', () => {
      const source = `
fun main() i32 {
  bool x = 5 < 5;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
    });

    it('应该正确处理变量小于比较', () => {
      const source = `
fun main() i32 {
  i32 a = 10;
  i32 b = 20;
  bool x = a < b;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
    });

    it('应该正确处理浮点数小于比较', () => {
      const source = `
fun main() i32 {
  bool x = 3.0 < 5.0;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
    });

    it('应该正确处理负数小于比较', () => {
      const source = `
fun main() i32 {
  bool x = -10 < -5;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
    });
  });

  describe('小于等于运算 (<=)', () => {
    it('应该正确执行整数小于等于比较（小于）', () => {
      const source = `
fun main() i32 {
  bool x = 5 <= 10;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
    });

    it('应该正确执行整数小于等于比较（等于）', () => {
      const source = `
fun main() i32 {
  bool x = 5 <= 5;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
    });

    it('应该正确执行整数小于等于比较（false）', () => {
      const source = `
fun main() i32 {
  bool x = 10 <= 5;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
    });

    it('应该正确处理变量小于等于比较', () => {
      const source = `
fun main() i32 {
  i32 a = 15;
  i32 b = 15;
  bool x = a <= b;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
    });

    it('应该正确处理浮点数小于等于比较', () => {
      const source = `
fun main() i32 {
  bool x = 5.0 <= 5.0;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
    });
  });

  describe('边界情况', () => {
    it('应该正确处理零值比较', () => {
      const source = `
fun main() i32 {
  bool x = 0 > 0;
  bool y = 0 < 0;
  bool z = 0 == 0;
  printf("%d\\n", x);
  printf("%d\\n", y);
  printf("%d\\n", z);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
      expect(output).toContain('0');
      expect(output).toContain('1');
    });

    it('应该正确处理负数比较', () => {
      const source = `
fun main() i32 {
  bool x = -5 > -10;
  bool y = -5 < -10;
  printf("%d\\n", x);
  printf("%d\\n", y);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
      expect(output).toContain('0');
    });

    it('应该正确处理正负数比较', () => {
      const source = `
fun main() i32 {
  bool x = 5 > -5;
  bool y = -5 > 5;
  printf("%d\\n", x);
  printf("%d\\n", y);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
      expect(output).toContain('0');
    });

    it('应该正确处理大数比较', () => {
      const source = `
fun main() i32 {
  bool x = 1000 > 500;
  bool y = 1000 < 2000;
  printf("%d\\n", x);
  printf("%d\\n", y);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
      expect(output).toContain('1');
    });
  });

  describe('复合比较表达式', () => {
    it('应该正确处理比较运算的优先级', () => {
      const source = `
fun main() i32 {
  bool x = 5 + 3 > 2 * 3;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      // (5 + 3) > (2 * 3) = 8 > 6 = 1
      expect(output).toContain('1');
    });

    it('应该正确处理括号中的比较运算', () => {
      const source = `
fun main() i32 {
  bool x = (5 > 3) == 1;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      // (5 > 3) == 1 = 1 == 1 = 1
      expect(output).toContain('1');
    });

    it('应该正确处理多个比较运算', () => {
      const source = `
fun main() i32 {
  bool x = 5 > 3;
  bool y = 10 < 20;
  printf("%d\\n", x);
  printf("%d\\n", y);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
      expect(output).toContain('1');
    });

    it('应该正确处理链式比较运算', () => {
      const source = `
fun main() i32 {
  i32 a = 5;
  i32 b = 10;
  i32 c = 15;
  bool x = a < b;
  bool y = b < c;
  printf("%d\\n", x);
  printf("%d\\n", y);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
      expect(output).toContain('1');
    });
  });

  describe('不同类型之间的比较', () => {
    it('应该正确处理整数和浮点数比较', () => {
      const source = `
fun main() i32 {
  i32 a = 5;
  float b = 5.0;
  bool x = a == b;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
    });

    it('应该正确处理不同整数类型比较', () => {
      const source = `
fun main() i32 {
  i8 a = 5;
  i32 b = 5;
  bool x = a == b;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
    });
  });

  describe('变量赋值后的比较', () => {
    it('应该正确处理变量赋值后的比较', () => {
      const source = `
fun main() i32 {
  i32 x = 23;
  x = 20;
  bool y = x > 15;
  printf("%d\\n", y);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
    });

    it('应该正确处理多个变量赋值后的比较', () => {
      const source = `
fun main() i32 {
  i32 a = 5;
  i32 b = 10;
  a = a + 5;
  bool x = a == b;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
    });
  });

  describe('复杂比较表达式', () => {
    it('应该正确处理包含算术运算的比较', () => {
      const source = `
fun main() i32 {
  bool x = (10 + 5) > (3 * 4);
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      // (10 + 5) > (3 * 4) = 15 > 12 = 1
      expect(output).toContain('1');
    });

    it('应该正确处理嵌套的比较表达式', () => {
      const source = `
fun main() i32 {
  i32 a = 5;
  i32 b = 10;
  i32 c = 15;
  bool x = (a < b) == (b < c);
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      // (5 < 10) == (10 < 15) = 1 == 1 = 1
      expect(output).toContain('1');
    });

    it('应该正确处理包含取模的比较', () => {
      const source = `
fun main() i32 {
  bool x = (10 % 3) > 1;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      // (10 % 3) > 1 = 1 > 1 = 0
      expect(output).toContain('0');
    });

    it('应该正确处理包含位移的比较', () => {
      const source = `
fun main() i32 {
  bool x = (1 << 3) > 5;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      // (1 << 3) > 5 = 8 > 5 = 1
      expect(output).toContain('1');
    });

    it('应该正确处理多层嵌套的比较表达式', () => {
      const source = `
fun main() i32 {
  bool x = ((5 + 3) * 2) > ((10 - 2) / 2);
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      // ((5 + 3) * 2) > ((10 - 2) / 2) = 16 > 4 = 1
      expect(output).toContain('1');
    });
  });

  describe('浮点数比较边界情况', () => {
    it('应该正确处理浮点数相等比较', () => {
      const source = `
fun main() i32 {
  bool x = 3.0 == 3.0;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
    });

    it('应该正确处理浮点数不等比较', () => {
      const source = `
fun main() i32 {
  i1 x = 3.0 != 2.0;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
    });

    it('应该正确处理浮点数大小比较', () => {
      const source = `
fun main() i32 {
  i1 x = 5.0 > 3.0;
  i1 y = 2.0 < 4.0;
  printf("%d\\n", x);
  printf("%d\\n", y);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
      expect(output).toContain('1');
    });

    it('应该正确处理浮点数零值比较', () => {
      const source = `
fun main() i32 {
  bool  x = 0.0 == 0.0;
  bool y = 0.0 > 0.0;
  printf("%d\\n", x);
  printf("%d\\n", y);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
      expect(output).toContain('0');
    });

    it('应该正确处理浮点数负数比较', () => {
      const source = `
fun main() i32 {
  bool x = -3.0 > -5.0;
  bool y = -5.0 < -3.0;
  printf("%d\\n", x);
  printf("%d\\n", y);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
      expect(output).toContain('1');
    });
  });

  describe('i8类型比较', () => {
    it('应该正确处理i8类型相等比较', () => {
      const source = `
fun main() i32 {
  i8 a = 5;
  i8 b = 5;
  bool x = a == b;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
    });

    it('应该正确处理i8类型大小比较', () => {
      const source = `
fun main() i32 {
  i8 a = 10;
  i8 b = 5;
  bool x = a > b;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
    });

    it('应该正确处理i8类型负数比较', () => {
      const source = `
fun main() i32 {
  i8 a = -5;
  i8 b = -10;
  bool x = a > b;
  printf("%d\\n", x);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
    });
  });
});
