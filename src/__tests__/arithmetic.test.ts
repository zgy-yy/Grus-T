import { describe, it, expect } from 'vitest';
import { compileAndRun } from './util';


describe('算数运算测试', () => {
  describe('基本四则运算', () => {
    it('应该正确执行整数加法', () => {
      const source = `
fun main() i32 {
  let i32 x = 10 + 20;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('30');
    });

    it('应该正确执行整数减法', () => {
      const source = `
fun main() i32 {
  let i32 x = 50 - 20;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('30');
    });

    it('应该正确执行整数乘法', () => {
      const source = `
fun main() i32 {
  let i32 x = 5 * 6;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('30');
    });

    it('应该正确执行整数除法', () => {
      const source = `
fun main() i32 {
  let i32 x = 100 / 4;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('25');
    });

    it('应该正确执行整数取模', () => {
      const source = `
fun main() i32 {
  let i32 x = 17 % 5;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('2');
    });
  });

  describe('一元运算', () => {
    it('应该正确执行整数取反', () => {
      const source = `
fun main() i32 {
  let i32 x = -13;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('-13');
    });

    it('应该正确执行表达式取反', () => {
      const source = `
fun main() i32 {
  let i32 x = -(10 + 5);
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('-15');
    });
  });

  describe('复合表达式', () => {
    it('应该正确执行多个运算符的表达式', () => {
      const source = `
fun main() i32 {
  let i32 x = 10 + 20 * 2;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('50');
    });

    it('应该正确处理括号优先级', () => {
      const source = `
fun main() i32 {
  let i32 x = (10 + 5) * 2;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('30');
    });

    it('应该正确处理复杂表达式', () => {
      const source = `
fun main() i32 {
  let i32 x = 2 + 3 * 4 - 5;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('9');
    });

    it('应该正确处理嵌套括号', () => {
      const source = `
fun main() i32 {
  let i32 x = ((10 + 5) * 2) / 3;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('10');
    });
  });

  describe('变量参与的算数运算', () => {
    it('应该正确执行变量之间的运算', () => {
      const source = `
fun main() i32 {
  let i32 a = 10;
  let i32 b = 20;
  let i32 c = a + b;
  printf("%d\\n", c);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('30');
    });

    it('应该正确处理变量赋值后的运算', () => {
      const source = `
fun main() i32 {
  let i32 x = 42;
  x = x + 58;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('100');
    });

    it('应该正确处理多个变量的复合运算', () => {
      const source = `
fun main() i32 {
  let i32 a = 5;
  let i32 b = 3;
  let i32 c = 2;
  let i32 result = a * b + c;
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('17');
    });
  });

  describe('浮点数运算', () => {
    it('应该正确执行浮点数加法', () => {
      const source = `
fun main() i32 {
  let float x = 3;
  let float y = 2;
  let float z = x + y;
  printf("%f\\n", z);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(parseFloat(output)).toBeCloseTo(5.0, 1);
    });

    it('应该正确执行浮点数减法', () => {
      const source = `
fun main() i32 {
  let float x = 10;
  let float y = 3;
  let float z = x - y;
  printf("%f\\n", z);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(parseFloat(output)).toBeCloseTo(7.0, 1);
    });

    it('应该正确执行浮点数乘法', () => {
      const source = `
fun main() i32 {
  let float x = 3;
  let float y = 2.5;
  let float z = x * y;
  printf("%f\\n", z);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(parseFloat(output)).toBeCloseTo(7.5, 1);
    });

    it('应该正确执行浮点数除法', () => {
      const source = `
fun main() i32 {
  let float x = 10;
  let float y = 4;
  let float z = x / y;
  printf("%f\\n", z);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(parseFloat(output)).toBeCloseTo(2.5, 1);
    });

    it('应该正确执行浮点数取模', () => {
      const source = `
fun main() i32 {
  let float x = 10;
  let float y = 3;
  let float z = x % y;
  printf("%f\\n", z);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(parseFloat(output)).toBeCloseTo(1.0, 1);
    });

    it('应该正确执行浮点数取反', () => {
      const source = `
fun main() i32 {
  let float x = 5;
  let float y = -x;
  printf("%f\\n", y);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(parseFloat(output)).toBeCloseTo(-5.0, 1);
    });
  });

  describe('类型转换与算数运算', () => {
    it('应该正确处理整数到浮点数的转换运算', () => {
      const source = `
fun main() i32 {
  let float x = 10;
  printf("%f\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(parseFloat(output)).toBeCloseTo(10.0, 1);
    });

    it('应该正确处理混合类型的运算', () => {
      const source = `
fun main() i32 {
  let i32 a = 5;
  let float b = 2.5;
  let float c = a + b;
  printf("%f\\n", c);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(parseFloat(output)).toBeCloseTo(7.5, 1);
    });
  });

  describe('边界情况', () => {
    it('应该正确处理零值运算', () => {
      const source = `
fun main() i32 {
  let i32 x = 0 + 0;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
    });

    it('应该正确处理负数运算', () => {
      const source = `
fun main() i32 {
  let i32 x = -10 + 5;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('-5');
    });

    it('应该正确处理大数运算', () => {
      const source = `
fun main() i32 {
  let i32 x = 1000 * 1000;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1000000');
    });
  });

  describe('复杂算数表达式', () => {
    it('应该正确处理深层嵌套的括号表达式', () => {
      const source = `
fun main() i32 {
  let i32 x = ((((2 + 3) * 4) - 5) / 3) * 2;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('10');
    });

    it('应该正确处理多运算符链式运算', () => {
      const source = `
fun main() i32 {
  let i32 x = 1 + 2 * 3 - 4 / 2 + 5;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('10');
    });

    it('应该正确处理复杂的混合运算', () => {
      const source = `
fun main() i32 {
  let i32 x = (10 + 5) * (20 - 8) / 3 - 2;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('58');
    });

    it('应该正确处理多层嵌套的复合表达式', () => {
      const source = `
fun main() i32 {
  let i32 x = ((10 + 5) * 2) + ((20 - 8) / 2) - 3;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('33');
    });

    it('应该正确处理包含取模的复杂表达式', () => {
      const source = `
fun main() i32 {
  let i32 x = (100 % 7) * 3 + (50 % 6) - 2;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('6');
    });

    it('应该正确处理多个一元运算符', () => {
      const source = `
fun main() i32 {
  let i32 x = -(-(10 + 5));
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('15');
    });

    it('应该正确处理复杂的链式变量运算', () => {
      const source = `
fun main() i32 {
  let i32 a = 10;
  let i32 b = 20;
  let i32 c = 30;
  let i32 d = a + b * c - a * b;
  printf("%d\\n", d);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('410');
    });

    it('应该正确处理多步骤的算数计算', () => {
      const source = `
fun main() i32 {
  let i32 step1 = 2 + 3;
  let i32 step2 = step1 * 4;
  let i32 step3 = step2 - 5;
  let i32 result = step3 / 3;
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('5');
    });

    it('应该正确处理复杂的浮点数表达式', () => {
      const source = `
fun main() i32 {
  let float a = 10;
  let float b = 3;
  let float c = 2;
  let float result = (a + b) * c - (a / b) + (b % c);
  printf("%f\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(parseFloat(output)).toBeCloseTo(23.666667, 1);
    });

    it('应该正确处理嵌套的浮点数运算', () => {
      const source = `
fun main() i32 {
  let float x = ((10.5 + 5.5) * 2.0) / 3.0 - 1.0;
  printf("%f\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(parseFloat(output)).toBeCloseTo(9.67, 1);
    });

    it('应该正确处理变量重新赋值的复杂运算', () => {
      const source = `
fun main() i32 {
  let i32 x = 10;
  x = x * 2;
  x = x + 5;
  x = x - 3;
  x = x / 2;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('11');
    });

    it('应该正确处理包含所有运算符的复杂表达式', () => {
      const source = `
fun main() i32 {
  let i32 x = (10 + 5) * 2 - 20 / 4 + 17 % 5;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('27');
    });

    it('应该正确处理左右结合的复杂表达式', () => {
      const source = `
fun main() i32 {
  let i32 x = 100 - 50 - 20 - 10;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('20');
    });

    it('应该正确处理乘除混合的复杂表达式', () => {
      const source = `
fun main() i32 {
  let i32 x = 100 / 2 * 3 / 5 * 4;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('120');
    });

    it('应该正确处理复杂的负数运算', () => {
      const source = `
fun main() i32 {
  let i32 x = -10 + (-5) * (-2) - (-3);
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('3');
    });

    it('应该正确处理多层括号和运算符优先级', () => {
      const source = `
fun main() i32 {
  let i32 x = ((2 + 3) * (4 - 1)) / ((6 - 3) * 1) + 5;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('10');
    });

    it('应该正确处理复杂的浮点数链式运算', () => {
      const source = `
fun main() i32 {
  let float a = 10;
  let float b = 3;
  let float c = 2;
  let float d = 5;
  let float result = (a + b) * c / d - (a / b) + (c * d);
  printf("%f\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(parseFloat(output)).toBeCloseTo(11.8666666, 1);
    });

    it('应该正确处理变量间的复杂依赖关系', () => {
      const source = `
fun main() i32 {
  let i32 a = 5;
  let i32 b = a * 2;
  let i32 c = b + a;
  let i32 d = c - a;
  let i32 e = d / a;
  printf("%d\\n", e);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('2');
    });

    it('应该正确处理包含取模的复杂链式运算', () => {
      const source = `
fun main() i32 {
  let i32 x = (100 % 7) + (50 % 6) * 2 - (30 % 4);
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('4');
    });

    it('应该正确处理非常深的嵌套表达式', () => {
      const source = `
fun main() i32 {
  let i32 x = (((((2 + 1) * 2) + 1) * 2) + 1) * 2;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('30');
    });

    it('应该正确处理混合整数和浮点数的复杂运算', () => {
      const source = `
fun main() i32 {
  let i32 a = 10;
  let float b = 3.5;
  let float c = 2;
  let float result = (a + b) * c - (a / b);
  printf("%f\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(parseFloat(output)).toBeCloseTo(24.14285714, 1);
    });
  });
});
