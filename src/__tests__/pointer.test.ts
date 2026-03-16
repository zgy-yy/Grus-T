import { describe, it, expect } from 'vitest';
import { compileAndRun } from './util';

describe('指针测试', () => {
  describe('基本指针操作', () => {
    it('应该正确声明和初始化指针变量', () => {
      const source = `
fun main() i32 {
  let i32 x = 42;
  let @i32 ptr => x;
  printf("x = %d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('x = 42');
    });

    it('应该正确通过指针修改值', () => {
      const source = `
fun main() i32 {
  let i32 x = 10;
  let @i32 ptr => x;
  ptr = 20;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('20');
    });
    it('应该正确处理多个指针变量', () => {
      const source = `
fun main() i32 {
  let i32 a = 10;
  let i32 b = 20;
  let @i32 ptr1 => a;
  let @i32 ptr2 => b;
  ptr1 = 30;
  ptr2 = 40;
  printf("%d %d\\n", a, b);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('30');
      expect(output).toContain('40');
    });
  });

  describe('指针与函数', () => {
    it('应该正确在函数中使用指针', () => {
      const source = `
fun modify(i32 x) i32 {
  let @i32 ptr => x;
  ptr = 100;
  return x;
}

fun main() i32 {
  let i32 result = modify(50);
  printf("%d\\n", result);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('100');
    });

    it('应该正确处理指针作为参数', () => {
      const source = `
fun setValue(@i32 ptr, i32 val) void {
  ptr = val;
}

fun main() i32 {
  let i32 x = 0;
  let @i32 ptr => x;
  setValue(ptr, 99);
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('99');
    });
  });

  describe('指针与循环', () => {
    it('应该在循环中使用指针', () => {
      const source = `
fun main() i32 {
  let i32 x = 0;
  let @i32 ptr => x;
  let i32 i = 0;
  while (i < 5) {
    ptr = i;
    i = i + 1;
  }
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('4');
    });

    it('应该在 for 循环中使用指针', () => {
      const source = `
fun main() i32 {
  let i32 sum = 0;
  let @i32 ptr => sum;
  let i32 i = 0;
  for (i = 0; i < 10; i = i + 1) {
    ptr = sum + i;
  }
  printf("%d\\n", sum);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('45');
    });
  });

  describe('指针与条件语句', () => {
    it('应该在 if 语句中使用指针', () => {
      const source = `
fun main() i32 {
  let i32 x = 0;
  let @i32 ptr => x;
  if (true) {
    ptr = 42;
  } else {
    ptr = 0;
  }
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('42');
    });

    it('应该在嵌套 if 语句中使用指针', () => {
      const source = `
fun main() i32 {
  let i32 x = 0;
  let @i32 ptr => x;
  if (true) {
    if (true) {
      ptr = 100;
    }
  }
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('100');
    });
  });

  describe('指针与算术运算', () => {
    it('应该通过指针进行算术运算', () => {
      const source = `
fun main() i32 {
  let i32 x = 10;
  let @i32 ptr => x;
  ptr = x + 5;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('15');
    });

    it('应该通过指针进行复合运算', () => {
      const source = `
fun main() i32 {
  let i32 x = 10;
  let @i32 ptr => x;
  ptr = x * 2;
  ptr = x - 5;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('15');
    });
  });

  describe('指针类型检查', () => {
    it('应该正确处理不同类型的指针', () => {
      const source = `
fun main() i32 {
  let i32 x = 42;
  let i8 y = 8;
  let @i32 ptr1 => x;
  let @i8 ptr2 => y;
  printf("pointers created\\n");
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('pointers created');
    });
  });

  describe('指针与返回值', () => {
    it('应该正确处理返回指针的函数', () => {
      const source = `
fun getPtr(@i32 ptr) @i32 {
  return ptr;
}

fun main() i32 {
  let i32 x = 50;
  let @i32 ptr1 => x;
  let @i32 ptr2 => getPtr(ptr1);
  ptr2 = 99;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('99');
    });
  });

  describe('复杂指针场景', () => {
    it('应该正确处理多个指针指向同一个变量', () => {
      const source = `
fun main() i32 {
  let i32 x = 0;
  let @i32 ptr1 => x;
  let @i32 ptr2 => x;
  ptr1 = 10;
  ptr2 = 20;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('20');
    });

    it('应该正确处理指针链式赋值', () => {
      const source = `
fun main() i32 {
  let i32 a = 1;
  let i32 b = 2;
  let @i32 ptr1 => a;
  let @i32 ptr2 => b;
  ptr1 = 10;
  ptr2 = 20;
  printf("%d %d\\n", a, b);
  return 0;
}
`;
      const output = compileAndRun(source);
      // 注意：这个测试可能需要根据实际的语义调整
      expect(output).toContain('20');
    });
  });

  describe('指针作用域', () => {
    it('应该正确处理指针在不同作用域中的使用', () => {
      const source = `
fun main() i32 {
  let i32 x = 0;
  {
    let @i32 ptr => x;
    ptr = 42;
  }
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('42');
    });
  });
});
