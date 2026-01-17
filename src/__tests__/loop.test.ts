import { describe, it, expect } from 'vitest';
import { compileAndRun } from './util';

describe('loop 循环测试', () => {
  describe('基本 loop 循环', () => {
    it('应该正确执行基本的 loop 循环（使用 break）', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  loop {
    printf("%d\\n", i);
    i = i + 1;
    if (i >= 5) {
      break;
    }
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

    it('应该正确处理单次循环', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  loop {
    printf("%d\\n", i);
    break;
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
    });

    it('应该正确处理多次循环', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  loop {
    printf("%d\\n", i);
    i = i + 1;
    if (i >= 3) {
      break;
    }
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

  describe('loop 循环体', () => {
    it('应该正确处理单语句循环体', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  loop {
    printf("%d\\n", i);
    i = i + 1;
    if (i >= 1) {
      break;
    }
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
    });

    it('应该正确处理多语句循环体', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  loop {
    printf("i=%d\\n", i);
    i = i + 1;
    if (i >= 3) {
      break;
    }
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('i=0');
      expect(output).toContain('i=1');
      expect(output).toContain('i=2');
    });

    it('应该在循环体中修改变量', () => {
      const source = `
fun main() i32 {
  i32 sum = 0;
  i32 i = 0;
  loop {
    sum = sum + i;
    i = i + 1;
    if (i > 5) {
      break;
    }
  }
  printf("%d\\n", sum);
  return 0;
}
`;
      const output = compileAndRun(source);
      // 0+1+2+3+4+5 = 15
      expect(output).toContain('15');
    });
  });

  describe('嵌套 loop 循环', () => {
    it('应该正确处理两层嵌套 loop 循环', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  loop {
    i32 j = 0;
    loop {
      printf("%d,%d\\n", i, j);
      j = j + 1;
      if (j >= 2) {
        break;
      }
    }
    i = i + 1;
    if (i >= 2) {
      break;
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

    it('应该正确处理三层嵌套 loop 循环', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  loop {
    i32 j = 0;
    loop {
      i32 k = 0;
      loop {
        printf("%d\\n", i + j + k);
        k = k + 1;
        if (k >= 2) {
          break;
        }
      }
      j = j + 1;
      if (j >= 2) {
        break;
      }
    }
    i = i + 1;
    if (i >= 2) {
      break;
    }
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

  describe('loop 与其他循环组合', () => {
    it('应该正确处理 loop 和 for 循环组合', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  loop {
    for (i32 j = 0; j < 2; j = j + 1) {
      printf("%d,%d\\n", i, j);
    }
    i = i + 1;
    if (i >= 2) {
      break;
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

    it('应该正确处理 loop 和 while 循环组合', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  loop {
    i32 j = 0;
    while (j < 2) {
      printf("%d,%d\\n", i, j);
      j = j + 1;
    }
    i = i + 1;
    if (i >= 2) {
      break;
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
  });

  describe('loop 与条件语句组合', () => {
    it('应该在 loop 循环中使用 if 语句控制 break', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  loop {
    if (i % 2 == 0) {
      printf("even:%d\\n", i);
    } else {
      printf("odd:%d\\n", i);
    }
    i = i + 1;
    if (i >= 5) {
      break;
    }
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('even:0');
      expect(output).toContain('odd:1');
      expect(output).toContain('even:2');
      expect(output).toContain('odd:3');
      expect(output).toContain('even:4');
    });

    it('应该正确处理多个条件控制 break', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  loop {
    printf("%d\\n", i);
    i = i + 1;
    if (i >= 3) {
      break;
    }
    if (i < 0) {
      break;
    }
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

  describe('break 语句', () => {
    it('应该正确使用 break 跳出 loop 循环', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  loop {
    printf("%d\\n", i);
    i = i + 1;
    if (i >= 3) {
      break;
    }
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
      expect(output).toContain('1');
      expect(output).toContain('2');
      expect(output).not.toContain('3');
    });

    it('应该正确处理嵌套 loop 中的 break（内层）', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  loop {
    i32 j = 0;
    loop {
      printf("%d,%d\\n", i, j);
      j = j + 1;
      if (j >= 2) {
        break;
      }
    }
    i = i + 1;
    if (i >= 2) {
      break;
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

    it('应该正确处理嵌套 loop 中的 break（外层）', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  loop {
    i32 j = 0;
    loop {
      printf("%d,%d\\n", i, j);
      j = j + 1;
      if (j >= 2) {
        break;
      }
    }
    i = i + 1;
    if (i >= 2) {
      break;
    }
  }
  printf("after\\n");
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0,0');
      expect(output).toContain('0,1');
      expect(output).toContain('1,0');
      expect(output).toContain('1,1');
      expect(output).toContain('after');
    });

    it('应该正确处理 break 在循环开始处', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  loop {
    if (i >= 3) {
      break;
    }
    printf("%d\\n", i);
    i = i + 1;
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

  describe('continue 语句', () => {
    it('应该正确使用 continue 跳过当前迭代', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  loop {
    i = i + 1;
    if (i % 2 == 0) {
      continue;
    }
    printf("%d\\n", i);
    if (i >= 5) {
      break;
    }
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
      expect(output).toContain('3');
      expect(output).toContain('5');
      expect(output).not.toContain('2');
      expect(output).not.toContain('4');
    });

    it('应该正确处理嵌套 loop 中的 continue', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  loop {
    i = i + 1;
    i32 j = 0;
    loop {
      j = j + 1;
      if (j == 2) {
        continue;
      }
      printf("%d,%d\\n", i, j);
      if (j >= 3) {
        break;
      }
    }
    if (i >= 2) {
      break;
    }
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1,1');
      expect(output).toContain('1,3');
      expect(output).toContain('2,1');
      expect(output).toContain('2,3');
      expect(output).not.toContain(',2');
    });

    it('应该正确处理 continue 在循环开始处', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  loop {
    i = i + 1;
    if (i % 2 == 0) {
      continue;
    }
    printf("%d\\n", i);
    if (i >= 5) {
      break;
    }
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
      expect(output).toContain('3');
      expect(output).toContain('5');
    });
  });

  describe('break 和 continue 组合', () => {
    it('应该正确处理 break 和 continue 的组合使用', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  loop {
    i = i + 1;
    if (i > 5) {
      break;
    }
    if (i % 2 == 0) {
      continue;
    }
    printf("%d\\n", i);
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
      expect(output).toContain('3');
      expect(output).toContain('5');
      expect(output).not.toContain('2');
      expect(output).not.toContain('4');
    });

    it('应该正确处理嵌套循环中的 break 和 continue', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  loop {
    i = i + 1;
    i32 j = 0;
    loop {
      j = j + 1;
      if (j > 3) {
        break;
      }
      if (j == 2) {
        continue;
      }
      printf("%d,%d\\n", i, j);
    }
    if (i >= 2) {
      break;
    }
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1,1');
      expect(output).toContain('1,3');
      expect(output).toContain('2,1');
      expect(output).toContain('2,3');
      expect(output).not.toContain(',2');
    });
  });

  describe('边界情况', () => {
    it('应该正确处理立即 break', () => {
      const source = `
fun main() i32 {
  loop {
    break;
    printf("never\\n");
  }
  printf("after\\n");
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('after');
      expect(output).not.toContain('never');
    });

    it('应该正确处理立即 continue', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  loop {
    if (i == 0) {
      i = i + 1;
      continue;
    }
    printf("%d\\n", i);
    i = i + 1;
    if (i >= 3) {
      break;
    }
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
      expect(output).toContain('2');
      expect(output).not.toContain('0');
    });

    it('应该正确处理循环体中的变量声明', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  loop {
    i32 temp = i * 2;
    printf("%d\\n", temp);
    i = i + 1;
    if (i >= 3) {
      break;
    }
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
      expect(output).toContain('2');
      expect(output).toContain('4');
    });

    it('应该正确处理循环前后的语句', () => {
      const source = `
fun main() i32 {
  printf("start\\n");
  i32 i = 0;
  loop {
    printf("%d\\n", i);
    i = i + 1;
    if (i >= 2) {
      break;
    }
  }
  printf("end\\n");
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('start');
      expect(output).toContain('0');
      expect(output).toContain('1');
      expect(output).toContain('end');
    });
  });

  describe('多个连续的 loop 循环', () => {
    it('应该正确处理多个连续的 loop 循环', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  loop {
    printf("A%d\\n", i);
    i = i + 1;
    if (i >= 2) {
      break;
    }
  }
  
  i32 j = 0;
  loop {
    printf("B%d\\n", j);
    j = j + 1;
    if (j >= 2) {
      break;
    }
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
