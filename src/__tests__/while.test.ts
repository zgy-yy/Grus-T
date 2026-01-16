import { describe, it, expect } from 'vitest';
import { compileAndRun } from './util';

describe('while 循环测试', () => {
  describe('基本 while 循环', () => {
    it('应该正确执行基本的 while 循环', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  while (i < 5) {
    printf("%d\\n", i);
    i = i + 1;
  }
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
      expect(output).toContain('1');
      expect(output).toContain('2');
      expect(output).toContain('3');
      expect(output).toContain('4');
    });

    it('应该正确处理零次循环（条件为假）', () => {
      const source = `
fun main() i32 {
  i32 i = 10;
  while (i < 5) {
    printf("%d\\n", i);
    i = i + 1;
  }
  printf("after\\n");
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('after');
      expect(output).not.toContain('10');
    });

    it('应该正确处理单次循环', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  while (i < 1) {
    printf("%d\\n", i);
    i = i + 1;
  }
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
      expect(output).not.toContain('1');
    });

    it('应该正确处理多次循环', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  while (i < 3) {
    printf("%d\\n", i);
    i = i + 1;
  }
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
      expect(output).toContain('1');
      expect(output).toContain('2');
    });
  });

  describe('while 循环的条件', () => {
    it('应该正确处理 <= 条件', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  while (i <= 3) {
    printf("%d\\n", i);
    i = i + 1;
  }
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
  i32 i = 5;
  while (i > 2) {
    printf("%d\\n", i);
    i = i - 1;
  }
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
  i32 i = 3;
  while (i >= 1) {
    printf("%d\\n", i);
    i = i - 1;
  }
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
  i32 i = 0;
  while (i == 0) {
    printf("%d\\n", i);
    i = i + 1;
  }
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
      expect(output).not.toContain('1');
    });

    it('应该正确处理 != 条件', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  while (i != 3) {
    printf("%d\\n", i);
    i = i + 1;
  }
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
      expect(output).toContain('1');
      expect(output).toContain('2');
    });
  });

  describe('边界情况', () => {
    it('应该正确处理零值条件', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  while (false) {
    printf("%d\\n", i);
    i = i + 1;
  }
  printf("after\\n");
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('after');
      expect(output).not.toContain('0');
    });

    it('应该正确处理负数条件', () => {
      const source = `
fun main() i32 {
  i32 i = -3;
  while (i < 0) {
    printf("%d\\n", i);
    i = i + 1;
  }
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('-3');
      expect(output).toContain('-2');
      expect(output).toContain('-1');
    });

    it('应该正确处理大数条件', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  while (i < 10) {
    printf("%d\\n", i);
    i = i + 1;
  }
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
      expect(output).toContain('9');
      expect(output).not.toContain('10');
    });

    it('应该正确处理浮点数条件', () => {
      const source = `
fun main() i32 {
  float f = 0.0;
  while (f < 3.0) {
    printf("%.0f\\n", f);
    f = f + 1.0;
  }
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
      expect(output).toContain('1');
      expect(output).toContain('2');
    });

    it('应该正确处理布尔变量作为条件', () => {
      const source = `
fun main() i32 {
  bool flag = true;
  i32 count = 0;
  while (flag) {
    printf("%d\\n", count);
    count = count + 1;
    if (count >= 3) {
      flag = false;
    }
  }
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
      expect(output).toContain('1');
      expect(output).toContain('2');
    });
  });

  describe('while 循环体', () => {
    it('应该正确处理单语句循环体', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  while (i < 1)
    printf("%d\\n", i++);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
    });

    it('应该正确处理多语句循环体', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  while (i < 3) {
    printf("i=%d\\n", i);
    i = i + 1;
  }
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
  i32 i = 0;
  while (i < 5) {
    i = i + 1;
  }
  printf("%d\\n", i);
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('5');
    });

    it('应该在循环体中修改变量', () => {
      const source = `
fun main() i32 {
  i32 sum = 0;
  i32 i = 0;
  while (i <= 5) {
    sum = sum + i;
    i = i + 1;
  }
  printf("%d\\n", sum);
}
`;
      const output = compileAndRun(source);
      // 0+1+2+3+4+5 = 15
      expect(output).toContain('15');
    });
  });

  describe('嵌套 while 循环', () => {
    it('应该正确处理两层嵌套 while 循环', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  while (i < 2) {
    i32 j = 0;
    while (j < 2) {
      printf("%d,%d\\n", i, j);
      j = j + 1;
    }
    i = i + 1;
  }
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0,0');
      expect(output).toContain('0,1');
      expect(output).toContain('1,0');
      expect(output).toContain('1,1');
    });

    it('应该正确处理三层嵌套 while 循环', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  while (i < 2) {
    i32 j = 0;
    while (j < 2) {
      i32 k = 0;
      while (k < 2) {
        printf("%d\\n", i + j + k);
        k = k + 1;
      }
      j = j + 1;
    }
    i = i + 1;
  }
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
      expect(output).toContain('1');
      expect(output).toContain('2');
      expect(output).toContain('3');
    });
  });

  describe('while 与其他循环组合', () => {
    it('应该正确处理 while 和 for 循环组合', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  while (i < 2) {
    for (i32 j = 0; j < 2; j = j + 1) {
      printf("%d,%d\\n", i, j);
    }
    i = i + 1;
  }
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0,0');
      expect(output).toContain('0,1');
      expect(output).toContain('1,0');
      expect(output).toContain('1,1');
    });

    it('应该正确处理 while 和 do-while 循环组合', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  while (i < 2) {
    i32 j = 0;
    do {
      printf("%d,%d\\n", i, j);
      j = j + 1;
    } while (j < 2);
    i = i + 1;
  }
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0,0');
      expect(output).toContain('0,1');
      expect(output).toContain('1,0');
      expect(output).toContain('1,1');
    });
  });

  describe('while 与条件语句组合', () => {
    it('应该在 while 循环中使用 if 语句', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  while (i < 5) {
    if (i % 2 == 0) {
      printf("even:%d\\n", i);
    } else {
      printf("odd:%d\\n", i);
    }
    i = i + 1;
  }
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('even:0');
      expect(output).toContain('odd:1');
      expect(output).toContain('even:2');
      expect(output).toContain('odd:3');
      expect(output).toContain('even:4');
    });
  });

  describe('复杂条件表达式', () => {
    it('应该正确处理算术表达式作为条件', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  while (i + 1 < 5) {
    printf("%d\\n", i);
    i = i + 1;
  }
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
  i32 i = 0;
  i32 limit = 4;
  while (i < limit) {
    printf("%d\\n", i);
    i = i + 1;
  }
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
      expect(output).toContain('1');
      expect(output).toContain('2');
      expect(output).toContain('3');
    });
  });

  describe('变量操作', () => {
    it('应该在循环中修改条件变量', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  while (i < 6) {
    printf("%d\\n", i);
    i = i + 2;
  }
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
      expect(output).toContain('2');
      expect(output).toContain('4');
    });

    it('应该正确处理后缀递增操作符', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  while (i < 3) {
    printf("%d\\n", i);
    i++;
  }
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
      expect(output).toContain('1');
      expect(output).toContain('2');
    });
  });

  describe('break 语句', () => {
    it('应该正确使用 break 跳出 while 循环', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  while (true) {
    printf("%d\\n", i);
    i = i + 1;
    if (i >= 3) {
      break;
    }
  }
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
      expect(output).toContain('1');
      expect(output).toContain('2');
      expect(output).not.toContain('3');
    });

    it('应该正确处理嵌套循环中的 break', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  while (i < 3) {
    i32 j = 0;
    while (j < 3) {
      printf("%d,%d\\n", i, j);
      j = j + 1;
      if (j >= 2) {
        break;
      }
    }
    i = i + 1;
  }
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0,0');
      expect(output).toContain('0,1');
      expect(output).toContain('1,0');
      expect(output).toContain('1,1');
      expect(output).toContain('2,0');
      expect(output).toContain('2,1');
    });
  });

  describe('continue 语句', () => {
    it('应该正确使用 continue 跳过当前迭代', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  while (i < 5) {
    i = i + 1;
    if (i % 2 == 0) {
      continue;
    }
    printf("%d\\n", i);
  }
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
      expect(output).toContain('3');
      expect(output).toContain('5');
      expect(output).not.toContain('2');
      expect(output).not.toContain('4');
    });

    it('应该正确处理嵌套循环中的 continue', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  while (i < 3) {
    i = i + 1;
    i32 j = 0;
    while (j < 3) {
      j = j + 1;
      if (j == 2) {
        continue;
      }
      printf("%d,%d\\n", i, j);
    }
  }
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1,1');
      expect(output).toContain('1,3');
      expect(output).toContain('2,1');
      expect(output).toContain('2,3');
      expect(output).toContain('3,1');
      expect(output).toContain('3,3');
      expect(output).not.toContain(',2');
    });
  });

  describe('多个连续的 while 循环', () => {
    it('应该正确处理多个连续的 while 循环', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  while (i < 2) {
    printf("A%d\\n", i);
    i = i + 1;
  }
  
  i32 j = 0;
  while (j < 2) {
    printf("B%d\\n", j);
    j = j + 1;
  }
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
