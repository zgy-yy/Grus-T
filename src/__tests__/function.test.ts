import { describe, it, expect } from 'vitest';
import { compileAndRun } from './util';

describe('函数调用测试', () => {
  describe('基本函数调用', () => {
    it('应该正确调用无参数无返回值的函数', () => {
      const source = `
fun foo() void {
  printf("foo called\\n");
}

fun main() i32 {
  foo();
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('foo called');
    });

    it('应该正确调用无参数有返回值的函数', () => {
      const source = `
fun getValue() i32 {
  return 42;
}

fun main() i32 {
  i32 x = getValue();
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('42');
    });

    it('应该正确调用带参数的函数', () => {
      const source = `
fun add(i32 a, i32 b) i32 {
  return a + b;
}

fun main() i32 {
  i32 result = add(10, 20);
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('30');
    });

    it('应该正确调用带多个参数的函数', () => {
      const source = `
fun multiply(i32 a, i32 b, i32 c) i32 {
  return a * b * c;
}

fun main() i32 {
  i32 result = multiply(2, 3, 4);
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('24');
    });
  });

  describe('函数返回值', () => {
    it('应该正确处理整数返回值', () => {
      const source = `
fun getInt() i32 {
  return 100;
}

fun main() i32 {
  i32 x = getInt();
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('100');
    });

    it('应该正确处理布尔返回值', () => {
      const source = `
fun isEven(i32 n) bool {
  return n % 2 == 0;
}

fun main() i32 {
  bool result = isEven(4);
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
    });

    it('应该正确处理浮点数返回值', () => {
      const source = `
fun getFloat() float {
  return 2.5;
}

fun main() i32 {
  float x = getFloat();
  printf("%.2f\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('2.5');
    });

    it('应该正确处理 void 返回值', () => {
      const source = `
fun printHello() void {
  printf("Hello\\n");
}

fun main() i32 {
  printHello();
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('Hello');
    });
  });

  describe('函数参数', () => {
    it('应该正确处理整数参数', () => {
      const source = `
fun square(i32 x) i32 {
  return x * x;
}

fun main() i32 {
  i32 result = square(5);
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('25');
    });

    it('应该正确处理多个整数参数', () => {
      const source = `
fun max(i32 a, i32 b) i32 {
  if (a > b) {
    return a;
  } else {
    return b;
  }
}

fun main() i32 {
  i32 result = max(10, 20);
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('20');
    });

    it('应该正确处理布尔参数', () => {
      const source = `
fun printBool(bool b) void {
  if (b) {
    printf("true\\n");
  } else {
    printf("false\\n");
  }
}

fun main() i32 {
  printBool(true);
  printBool(false);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('true');
      expect(output).toContain('false');
    });

    it('应该正确处理浮点数参数', () => {
      const source = `
fun doubleFloat(float x) float {
  return x * 2.0;
}

fun main() i32 {
  float result = doubleFloat(1.5);
  printf("%.1f\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('3.0');
    });
  });

  describe('嵌套函数调用', () => {
    it('应该正确处理函数调用链', () => {
      const source = `
fun addOne(i32 x) i32 {
  return x + 1;
}

fun addTwo(i32 x) i32 {
  return addOne(addOne(x));
}

fun main() i32 {
  i32 result = addTwo(5);
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('7');
    });

    it('应该正确处理多层嵌套调用', () => {
      const source = `
fun a() i32 {
  return 1;
}

fun b() i32 {
  return a() + 1;
}

fun c() i32 {
  return b() + 1;
}

fun main() i32 {
  i32 result = c();
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('3');
    });

    it('应该正确处理函数调用作为参数', () => {
      const source = `
fun getValue() i32 {
  return 10;
}

fun add(i32 a, i32 b) i32 {
  return a + b;
}

fun main() i32 {
  i32 result = add(getValue(), 5);
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('15');
    });
  });

  describe('递归函数调用', () => {
    it('应该正确处理阶乘递归', () => {
      const source = `
fun factorial(i32 n) i32 {
  if (n <= 1) {
    return 1;
  } else {
    return n * factorial(n - 1);
  }
}

fun main() i32 {
  i32 result = factorial(5);
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('120');
    });

    it('应该正确处理斐波那契递归', () => {
      const source = `
fun fibonacci(i32 n) i32 {
  if (n <= 1) {
    return n;
  } else {
    return fibonacci(n - 1) + fibonacci(n - 2);
  }
}

fun main() i32 {
  i32 result = fibonacci(6);
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('8');
    });
  });

  describe('函数调用与变量', () => {
    it('应该正确处理函数返回值赋值给变量', () => {
      const source = `
fun getNumber() i32 {
  return 42;
}

fun main() i32 {
  i32 x = getNumber();
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('42');
    });

    it('应该正确处理函数调用结果参与运算', () => {
      const source = `
fun getValue() i32 {
  return 10;
}

fun main() i32 {
  i32 result = getValue() * 2 + 5;
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('25');
    });

    it('应该正确处理函数调用结果作为条件', () => {
      const source = `
fun isPositive(i32 x) bool {
  return x > 0;
}

fun main() i32 {
  if (isPositive(5)) {
    printf("positive\\n");
  } else {
    printf("negative\\n");
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('positive');
    });
  });

  describe('函数调用与循环', () => {
    it('应该在循环中调用函数', () => {
      const source = `
fun printNumber(i32 n) void {
  printf("%d\\n", n);
}

fun main() i32 {
  for (i32 i = 0; i < 3; i = i + 1) {
    printNumber(i);
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
      expect(output).toContain('1');
      expect(output).toContain('2');
    });

  });

  describe('函数调用与条件语句', () => {
    it('应该在 if 语句中调用函数', () => {
      const source = `
fun printTrue() void {
  printf("true\\n");
}

fun printFalse() void {
  printf("false\\n");
}

fun main() i32 {
  if (true) {
    printTrue();
  } else {
    printFalse();
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('true');
      expect(output).not.toContain('false');
    });

    it('应该使用函数返回值作为条件', () => {
      const source = `
fun check(i32 x) bool {
  return x > 5;
}

fun main() i32 {
  if (check(10)) {
    printf("greater\\n");
  } else {
    printf("less\\n");
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('greater');
    });
  });

  describe('多个函数调用', () => {
    it('应该正确处理多个函数调用', () => {
      const source = `
fun a() void {
  printf("a\\n");
}

fun b() void {
  printf("b\\n");
}

fun c() void {
  printf("c\\n");
}

fun main() i32 {
  a();
  b();
  c();
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('a');
      expect(output).toContain('b');
      expect(output).toContain('c');
    });

    it('应该正确处理函数调用序列', () => {
      const source = `
fun step1() i32 {
  return 1;
}

fun step2(i32 x) i32 {
  return x + 1;
}

fun step3(i32 x) i32 {
  return x + 1;
}

fun main() i32 {
  i32 result = step3(step2(step1()));
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('3');
    });
  });

  describe('函数调用边界情况', () => {
    it('应该正确处理零参数函数', () => {
      const source = `
fun zero() i32 {
  return 0;
}

fun main() i32 {
  i32 result = zero();
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
    });

    it('应该正确处理返回零的函数', () => {
      const source = `
fun returnZero() i32 {
  return 0;
}

fun main() i32 {
  i32 x = returnZero();
  if (x == 0) {
    printf("zero\\n");
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('zero');
    });

    it('应该正确处理函数调用负数', () => {
      const source = `
fun negate(i32 x) i32 {
  return -x;
}

fun main() i32 {
  i32 result = negate(5);
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('-5');
    });

    it('应该正确处理函数调用大数', () => {
      const source = `
fun getLarge() i32 {
  return 1000;
}

fun main() i32 {
  i32 result = getLarge();
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1000');
    });
  });

  describe('函数调用与表达式', () => {
    it('应该正确处理函数调用在算术表达式中', () => {
      const source = `
fun getValue() i32 {
  return 10;
}

fun main() i32 {
  i32 result = getValue() + getValue() * 2;
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('30');
    });

    it('应该正确处理函数调用在比较表达式中', () => {
      const source = `
fun getA() i32 {
  return 5;
}

fun getB() i32 {
  return 10;
}

fun main() i32 {
  if (getA() < getB()) {
    printf("less\\n");
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('less');
    });

    it('应该正确处理函数调用在逻辑表达式中', () => {
      const source = `
fun isTrue() bool {
  return true;
}

fun isFalse() bool {
  return false;
}

fun main() i32 {
  if (isTrue() && !isFalse()) {
    printf("ok\\n");
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('ok');
    });
  });

  describe('printf 函数调用', () => {
    it('应该正确调用 printf 打印整数', () => {
      const source = `
fun main() i32 {
  printf("%d\\n", 42);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('42');
    });

    it('应该正确调用 printf 打印字符串', () => {
      const source = `
fun main() i32 {
  printf("Hello World\\n");
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('Hello World');
    });

    it('应该正确调用 printf 打印多个值', () => {
      const source = `
fun main() i32 {
  printf("%d %d\\n", 1, 2);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
      expect(output).toContain('2');
    });
  });

  describe('函数调用顺序', () => {
    it('应该正确处理函数先调用后定义', () => {
      const source = `
fun main() i32 {
  foo();
  return 0;
}

fun foo() void {
  printf("foo\\n");
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('foo');
    });

    it('应该正确处理函数先定义后调用', () => {
      const source = `
fun foo() void {
  printf("foo\\n");
}

fun main() i32 {
  foo();
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('foo');
    });
  });
});
