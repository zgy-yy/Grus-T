import { describe, it, expect } from 'vitest';
import { compileAndRun } from './util';

describe('Lambda 表达式测试', () => {
  describe('基本 Lambda 表达式', () => {
    it('应该正确创建无参数无返回值的 lambda', () => {
      const source = `
fun main() i32 {
  let () -> void f = () -> void {
    printf("lambda called\\n");
  };
  f();
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('lambda called');
    });

    it('应该正确创建无参数有返回值的 lambda', () => {
      const source = `
fun main() i32 {
  let () -> i32 f = () -> i32 {
    return 42;
  };
  let i32 result = f();
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('42');
    });

    it('应该正确创建带参数的 lambda', () => {
      const source = `
fun main() i32 {
  let (i32, i32) -> i32 add = (i32 a, i32 b) -> i32 {
    return a + b;
  };
  let i32 result = add(10, 20);
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('30');
    });

    it('应该正确处理单个参数的 lambda', () => {
      const source = `
fun main() i32 {
  let (i32) -> i32 square = (i32 x) -> i32 {
    return x * x;
  };
  let i32 result = square(5);
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('25');
    });
  });

  describe('Lambda 表达式返回值', () => {
    it('应该正确处理整数返回值', () => {
      const source = `
fun main() i32 {
  let (i32) -> i32 double = (i32 x) -> i32 {
    return x * 2;
  };
  let i32 result = double(21);
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('42');
    });

    it('应该正确处理布尔返回值', () => {
      const source = `
fun main() i32 {
  let (i32) -> bool isEven = (i32 n) -> bool {
    return n % 2 == 0;
  };
  let bool result = isEven(4);
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
    });

    it('应该正确处理 void 返回值', () => {
      const source = `
fun main() i32 {
  let (i32) -> void print = (i32 x) -> void {
    printf("%d\\n", x);
  };
  print(100);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('100');
    });
  });

  describe('Lambda 表达式参数', () => {
    it('应该正确处理多个参数', () => {
      const source = `
fun main() i32 {
  let (i32, i32, i32) -> i32 multiply = (i32 a, i32 b, i32 c) -> i32 {
    return a * b * c;
  };
  let i32 result = multiply(2, 3, 4);
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('24');
    });

    it('应该正确处理不同类型的参数', () => {
      const source = `
fun main() i32 {
  let (i32, float) -> float add = (i32 a, float b) -> float {
    return a + b;
  };
  let float result = add(10, 3.5);
  printf("%.1f\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(parseFloat(output)).toBeCloseTo(13.5, 1);
    });
  });

  describe('Lambda 表达式作为变量', () => {
    it('应该可以将 lambda 赋值给变量', () => {
      const source = `
fun main() i32 {
  let (i32) -> i32 f = (i32 x) -> i32 {
    return x + 1;
  };
  let i32 result = f(5);
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('6');
    });

    it('应该可以重新赋值 lambda', () => {
      const source = `
fun main() i32 {
  let (i32) -> i32 f = (i32 x) -> i32 {
    return x * 2;
  };
  let i32 result1 = f(5);
  f = (i32 x) -> i32 {
    return x * 3;
  };
  let i32 result2 = f(5);
  printf("%d,%d\\n", result1, result2);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('10');
      expect(output).toContain('15');
    });
  });

  describe('Lambda 表达式嵌套调用', () => {
    it('应该可以嵌套调用 lambda', () => {
      const source = `
fun main() i32 {
  let (i32) -> i32 addOne = (i32 x) -> i32 {
    return x + 1;
  };
  let (i32) -> i32 double = (i32 x) -> i32 {
    return x * 2;
  };
  let i32 result = double(addOne(5));
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('12');
    });

    it('应该可以传递 lambda 作为参数（通过变量）', () => {
      const source = `
fun main() i32 {
  let (i32) -> i32 f = (i32 x) -> i32 {
    return x * 2;
  };
  let (i32) -> i32 g = (i32 x) -> i32 {
    return x + 10;
  };
  let i32 result1 = f(5);
  let i32 result2 = g(5);
  printf("%d,%d\\n", result1, result2);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('10');
      expect(output).toContain('15');
    });
  });

  describe('Lambda 表达式中的复杂逻辑', () => {
    it('应该可以处理条件语句', () => {
      const source = `
fun main() i32 {
  let (i32) -> i32 abs = (i32 x) -> i32 {
    if (x < 0) {
      return -x;
    } else {
      return x;
    }
  };
  let i32 result1 = abs(5);
  let i32 result2 = abs(-5);
  printf("%d,%d\\n", result1, result2);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('5');
      expect(output).toContain('5');
    });

    it('应该可以处理循环', () => {
      const source = `
fun main() i32 {
  let (i32) -> i32 factorial = (i32 n) -> i32 {
    let i32 result = 1;
    for (let i32 i = 1; i <= n; i = i + 1) {
      result = result * i;
    }
    return result;
  };
  let i32 result = factorial(5);
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('120');
    });

    it('应该可以处理多个语句', () => {
      const source = `
fun main() i32 {
  let (i32, i32) -> i32 max = (i32 a, i32 b) -> i32 {
    if (a > b) {
      return a;
    } else {
      return b;
    }
  };
  let i32 result = max(10, 20);
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('20');
    });
  });

  describe('Lambda 表达式作用域', () => {
    it('应该可以访问外部变量', () => {
      const source = `
fun main() i32 {
  let i32 x = 10;
  let (i32) -> i32 addX = (i32 y) -> i32 {
    return x + y;
  };
  let i32 result = addX(5);
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('15');
    });

    it('应该可以修改外部变量（如果支持）', () => {
      const source = `
fun main() i32 {
  let i32 x = 10;
  let () -> void increment = () -> void {
    x = x + 1;
  };
  increment();
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('11');
    });
  });

  describe('Lambda 表达式边界情况', () => {
    it('应该正确处理空 lambda', () => {
      const source = `
fun main() i32 {
  let () -> void empty = () -> void {
  };
  empty();
  printf("done\\n");
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('done');
    });

    it('应该正确处理返回 0 的 lambda', () => {
      const source = `
fun main() i32 {
  let () -> i32 zero = () -> i32 {
    return 0;
  };
  let i32 result = zero();
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
    });

    it('应该正确处理负数参数', () => {
      const source = `
fun main() i32 {
  let (i32) -> i32 negate = (i32 x) -> i32 {
    return -x;
  };
  let i32 result = negate(-5);
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('5');
    });
  });

  describe('Lambda 表达式与算术运算', () => {
    it('应该可以在 lambda 中进行算术运算', () => {
      const source = `
fun main() i32 {
  let (i32, i32) -> i32 calculate = (i32 a, i32 b) -> i32 {
    return (a + b) * 2 - a;
  };
  let i32 result = calculate(5, 3);
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('11');
    });

    it('应该可以返回表达式结果', () => {
      const source = `
fun main() i32 {
  let (i32) -> i32 square = (i32 x) -> i32 {
    return x * x;
  };
  let i32 result = square(6);
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('36');
    });
  });

  describe('多个 Lambda 表达式', () => {
    it('应该可以定义多个 lambda', () => {
      const source = `
fun main() i32 {
  let (i32) -> i32 addOne = (i32 x) -> i32 {
    return x + 1;
  };
  let (i32) -> i32 double = (i32 x) -> i32 {
    return x * 2;
  };
  let i32 result1 = addOne(5);
  let i32 result2 = double(5);
  printf("%d,%d\\n", result1, result2);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('6');
      expect(output).toContain('10');
    });

    it('应该可以链式调用多个 lambda', () => {
      const source = `
fun main() i32 {
  let (i32) -> i32 addOne = (i32 x) -> i32 {
    return x + 1;
  };
  let (i32) -> i32 multiply = (i32 x) -> i32 {
    return x * 2;
  };
  let i32 result = multiply(addOne(addOne(5)));
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('14');
    });
  });
});
