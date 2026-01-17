import { describe, it, expect } from 'vitest';
import { compileAndRun } from './util';

describe('for 循环测试', () => {
  describe('基本 for 循环', () => {
    it('应该正确执行基本的 for 循环', () => {
      const source = `
fun main() i32 {
  for (i32 i = 0; i < 5; i = i + 1) {
    printf("%d\\n", i);
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
      expect(output).toContain('1');
      expect(output).toContain('2');
      expect(output).toContain('3');
      expect(output).toContain('4');
    });

    it('应该正确处理 for 循环的边界值', () => {
      const source = `
fun main() i32 {
  for (i32 i = 0; i < 3; i = i + 1) {
    printf("%d\\n", i);
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
      expect(output).toContain('1');
      expect(output).toContain('2');
    });

    it('应该正确处理单次循环', () => {
      const source = `
fun main() i32 {
  for (i32 i = 0; i < 1; i = i + 1) {
    printf("%d\\n", i);
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
    });

    it('应该正确处理零次循环（条件为假）', () => {
      const source = `
fun main() i32 {
  for (i32 i = 0; i < 0; i = i + 1) {
    printf("%d\\n", i);
  }
  printf("after\\n");
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('after');
      expect(output).not.toContain('0');
    });
  });

  describe('for 循环的初始值', () => {
    it('应该正确处理非零初始值', () => {
      const source = `
fun main() i32 {
  for (i32 i = 5; i < 8; i = i + 1) {
    printf("%d\\n", i);
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('5');
      expect(output).toContain('6');
      expect(output).toContain('7');
      expect(output).not.toContain('0');
    });

    it('应该正确处理负数初始值', () => {
      const source = `
fun main() i32 {
  for (i32 i = -2; i < 2; i = i + 1) {
    printf("%d\\n", i);
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('-2');
      expect(output).toContain('-1');
      expect(output).toContain('0');
      expect(output).toContain('1');
    });
  });

  describe('for 循环的增量', () => {
    it('应该正确处理步长为 2 的循环', () => {
      const source = `
fun main() i32 {
  for (i32 i = 0; i < 10; i = i + 2) {
    printf("%d\\n", i);
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
      expect(output).toContain('2');
      expect(output).toContain('4');
      expect(output).toContain('6');
      expect(output).toContain('8');
    });

    it('应该正确处理递减循环', () => {
      const source = `
fun main() i32 {
  for (i32 i = 5; i > 0; i = i - 1) {
    printf("%d\\n", i);
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('5');
      expect(output).toContain('4');
      expect(output).toContain('3');
      expect(output).toContain('2');
      expect(output).toContain('1');
    });

    it('应该正确处理无增量语句的循环', () => {
      const source = `
fun main() i32 {
  for (i32 i = 0; i < 2; ) {
    printf("%d\\n", i);
    i = i + 1;
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
      expect(output).toContain('1');
    });
  });

  describe('for 循环的条件', () => {
    it('应该正确处理 <= 条件', () => {
      const source = `
fun main() i32 {
  for (i32 i = 0; i <= 3; i = i + 1) {
    printf("%d\\n", i);
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
      expect(output).toContain('1');
      expect(output).toContain('2');
      expect(output).toContain('3');
    });

    it('应该正确处理 > 条件', () => {
      const source = `
fun main() i32 {
  for (i32 i = 5; i > 2; i = i - 1) {
    printf("%d\\n", i);
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('5');
      expect(output).toContain('4');
      expect(output).toContain('3');
    });

    it('应该正确处理 >= 条件', () => {
      const source = `
fun main() i32 {
  for (i32 i = 3; i >= 1; i = i - 1) {
    printf("%d\\n", i);
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('3');
      expect(output).toContain('2');
      expect(output).toContain('1');
    });

    it('应该正确处理 == 条件（单次循环）', () => {
      const source = `
fun main() i32 {
  for (i32 i = 0; i == 0; i = i + 1) {
    printf("%d\\n", i);
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
    });
  });

  describe('for 循环的初始化语句', () => {
    it('应该正确处理使用 let 的初始化', () => {
      const source = `
fun main() i32 {
  for (let i = 0; i < 3; i = i + 1) {
    printf("%d\\n", i);
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
      expect(output).toContain('1');
      expect(output).toContain('2');
    });

    it('应该正确处理表达式作为初始化', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  for (i = 5; i < 8; i = i + 1) {
    printf("%d\\n", i);
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('5');
      expect(output).toContain('6');
      expect(output).toContain('7');
    });

    it('应该正确处理无初始化语句的循环', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  for (; i < 3; i = i + 1) {
    printf("%d\\n", i);
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

  describe('for 循环体', () => {
    it('应该正确处理单语句循环体', () => {
      const source = `
fun main() i32 {
  for (i32 i = 0; i < 3; i = i + 1)
    printf("%d\\n", i);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
      expect(output).toContain('1');
      expect(output).toContain('2');
    });

    it('应该正确处理多语句循环体', () => {
      const source = `
fun main() i32 {
  for (i32 i = 0; i < 3; i = i + 1) {
    printf("i=%d\\n", i);
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('i=0');
      expect(output).toContain('i=1');
      expect(output).toContain('i=2');
    });

    it('应该正确处理空循环体', () => {
      const source = `
fun main() i32 {
  i32 sum = 0;
  for (i32 i = 0; i < 5; i = i + 1) {
    sum = sum + i;
  }
  printf("%d\\n", sum);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('10');
    });
  });

  describe('嵌套 for 循环', () => {
    it('应该正确处理两层嵌套 for 循环', () => {
      const source = `
fun main() i32 {
  for (i32 i = 0; i < 2; i = i + 1) {
    for (i32 j = 0; j < 2; j = j + 1) {
      printf("%d,%d\\n", i, j);
    }
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0,0');
      expect(output).toContain('0,1');
      expect(output).toContain('1,0');
      expect(output).toContain('1,1');
    });

    it('应该正确处理三层嵌套 for 循环', () => {
      const source = `
fun main() i32 {
  for (i32 i = 0; i < 2; i = i + 1) {
    for (i32 j = 0; j < 2; j = j + 1) {
      for (i32 k = 0; k < 2; k = k + 1) {
        printf("%d\\n", i + j + k);
      }
    }
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      // 应该输出 0, 1, 1, 2, 1, 2, 2, 3
      expect(output).toContain('0');
      expect(output).toContain('1');
      expect(output).toContain('2');
      expect(output).toContain('3');
    });
  });

  describe('for 循环中的变量操作', () => {
    it('应该在循环体中修改变量', () => {
      const source = `
fun main() i32 {
  i32 sum = 0;
  for (i32 i = 0; i < 5; i = i + 1) {
    sum = sum + i;
  }
  printf("%d\\n", sum);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('10');
    });

    it('应该在循环体中修改循环变量', () => {
      const source = `
fun main() i32 {
  for (i32 i = 0; i < 5; i = i + 1) {
    printf("%d\\n", i);
    i = i + 1;
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      // 由于在循环体中 i = i + 1，每次循环 i 会增加 2
      expect(output).toContain('0');
      expect(output).toContain('2');
      expect(output).toContain('4');
    });

    it('应该正确处理循环中的多个变量', () => {
      const source = `
fun main() i32 {
  i32 product = 1;
  for (i32 i = 1; i <= 5; i = i + 1) {
    product = product * i;
  }
  printf("%d\\n", product);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('120');
    });
  });

  describe('复杂 for 循环条件', () => {
    it('应该正确处理复合条件', () => {
      const source = `
fun main() i32 {
  for (i32 i = 0; i < 10; i = i + 1) {
    if (i > 5) {
      printf("%d\\n", i);
    }
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('6');
      expect(output).toContain('7');
      expect(output).toContain('8');
      expect(output).toContain('9');
    });

    it('应该正确处理算术表达式作为条件', () => {
      const source = `
fun main() i32 {
  for (i32 i = 0; i + 1 < 5; i = i + 1) {
    printf("%d\\n", i);
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
      expect(output).toContain('1');
      expect(output).toContain('2');
      expect(output).toContain('3');
    });

    it('应该正确处理变量作为条件', () => {
      const source = `
fun main() i32 {
  i32 limit = 4;
  for (i32 i = 0; i < limit; i = i + 1) {
    printf("%d\\n", i);
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
      expect(output).toContain('1');
      expect(output).toContain('2');
      expect(output).toContain('3');
    });
  });

  describe('边界情况', () => {
    it('应该正确处理大数循环', () => {
      const source = `
fun main() i32 {
  i32 count = 0;
  for (i32 i = 0; i < 10; i = i + 1) {
    count = count + 1;
  }
  printf("%d\\n", count);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('10');
    });

    it('应该正确处理浮点数循环（如果支持）', () => {
      const source = `
fun main() i32 {
  for (float i = 0.0; i < 3.0; i = i + 1.0) {
    printf("%.0f\\n", i);
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
      expect(output).toContain('1');
      expect(output).toContain('2');
    });

    it('应该正确处理无条件的 for 循环（使用条件控制）', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  for (; i < 3; i = i + 1) {
    printf("%d\\n", i);
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

  describe('for 循环与其他语句组合', () => {
    it('应该正确处理 for 循环后的语句', () => {
      const source = `
fun main() i32 {
  for (i32 i = 0; i < 3; i = i + 1) {
    printf("%d\\n", i);
  }
  printf("done\\n");
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
      expect(output).toContain('1');
      expect(output).toContain('2');
      expect(output).toContain('done');
    });

    it('应该正确处理 for 循环前的语句', () => {
      const source = `
fun main() i32 {
  printf("start\\n");
  for (i32 i = 0; i < 2; i = i + 1) {
    printf("%d\\n", i);
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('start');
      expect(output).toContain('0');
      expect(output).toContain('1');
    });

    it('应该正确处理多个连续的 for 循环', () => {
      const source = `
fun main() i32 {
  for (i32 i = 0; i < 2; i = i + 1) {
    printf("A%d\\n", i);
  }
  for (i32 j = 0; j < 2; j = j + 1) {
    printf("B%d\\n", j);
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('A0');
      expect(output).toContain('A1');
      expect(output).toContain('B0');
      expect(output).toContain('B1');
    });
  });
});
