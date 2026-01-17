import { describe, it, expect } from 'vitest';
import { compileAndRun } from './util';

describe('if 语句测试', () => {
  describe('基本 if 语句', () => {
    it('应该正确执行 if 语句（true 条件）', () => {
      const source = `
fun main() i32 {
  if (true) {
    printf("true\\n");
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('true');
    });

    it('应该正确执行 if 语句（false 条件）', () => {
      const source = `
fun main() i32 {
  if (false) {
    printf("true\\n");
  }
  printf("false\\n");
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('false');
      expect(output).not.toContain('true');
    });

    it('应该正确处理比较表达式作为条件', () => {
      const source = `
fun main() i32 {
  if (5 > 3) {
    printf("greater\\n");
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('greater');
    });

    it('应该正确处理相等比较作为条件', () => {
      const source = `
fun main() i32 {
  if (10 == 10) {
    printf("equal\\n");
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('equal');
    });
  });

  describe('if-else 语句', () => {
    it('应该正确执行 if-else 语句（true 分支）', () => {
      const source = `
fun main() i32 {
  if (true) {
    printf("if\\n");
  } else {
    printf("else\\n");
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('if');
      expect(output).not.toContain('else');
    });

    it('应该正确执行 if-else 语句（false 分支）', () => {
      const source = `
fun main() i32 {
  if (false) {
    printf("if\\n");
  } else {
    printf("else\\n");
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('else');
      expect(output).not.toContain('if');
    });

    it('应该正确处理比较表达式在 if-else 中', () => {
      const source = `
fun main() i32 {
  if (5 < 3) {
    printf("less\\n");
  } else {
    printf("not less\\n");
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('not less');
    });
  });

  describe('变量条件', () => {
    it('应该正确处理变量作为条件', () => {
      const source = `
fun main() i32 {
  i32 x = 10;
  if (x > 5) {
    printf("x is greater\\n");
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('x is greater');
    });

    it('应该正确处理布尔变量作为条件', () => {
      const source = `
fun main() i32 {
  bool flag = 5 == 5;
  if (flag) {
    printf("flag is true\\n");
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('flag is true');
    });

    it('应该正确处理变量赋值后的条件', () => {
      const source = `
fun main() i32 {
  i32 x = 3;
  x = 10;
  if (x > 5) {
    printf("x > 5\\n");
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('x > 5');
    });
  });

  describe('嵌套 if 语句', () => {
    it('应该正确处理嵌套 if 语句', () => {
      const source = `
fun main() i32 {
  if (true) {
    if (true) {
      printf("nested\\n");
    }
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('nested');
    });

    it('应该正确处理嵌套 if-else 语句', () => {
      const source = `
fun main() i32 {
  if (true) {
    if (false) {
      printf("inner if\\n");
    } else {
      printf("inner else\\n");
    }
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('inner else');
      expect(output).not.toContain('inner if');
    });

    it('应该正确处理多层嵌套', () => {
      const source = `
fun main() i32 {
  if (true) {
    if (true) {
      if (true) {
        printf("deep\\n");
      }
    }
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('deep');
    });
  });

  describe('if-else if-else 链', () => {
    it('应该正确处理 if-else if-else 链（第一个条件）', () => {
      const source = `
fun main() i32 {
  i32 x = 10;
  if (x > 20) {
    printf("large\\n");
  } else {
    if (x > 5) {
      printf("medium\\n");
    } else {
      printf("small\\n");
    }
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('medium');
      expect(output).not.toContain('large');
      expect(output).not.toContain('small');
    });

    it('应该正确处理 if-else if-else 链（最后一个条件）', () => {
      const source = `
fun main() i32 {
  i32 x = 3;
  if (x > 20) {
    printf("large\\n");
  } else {
    if (x > 5) {
      printf("medium\\n");
    } else {
      printf("small\\n");
    }
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('small');
      expect(output).not.toContain('large');
      expect(output).not.toContain('medium');
    });
  });

  describe('复杂条件表达式', () => {
    it('应该正确处理算术表达式作为条件', () => {
      const source = `
fun main() i32 {
  if (5 + 3 > 6) {
    printf("sum greater\\n");
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('sum greater');
    });

    it('应该正确处理复合比较条件', () => {
      const source = `
fun main() i32 {
  i32 x = 10;
  if (x > 5) {
    if (x < 15) {
      printf("in range\\n");
    }
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('in range');
    });

    it('应该正确处理括号中的条件', () => {
      const source = `
fun main() i32 {
  if ((5 + 3) * 2 > 10) {
    printf("calculated\\n");
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('calculated');
    });
  });

  describe('if 语句中的变量操作', () => {
    it('应该在 if 语句中修改变量', () => {
      const source = `
fun main() i32 {
  i32 x = 5;
  if (x > 0) {
    x = 10;
    printf("%d\\n", x);
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('10');
    });

    it('应该在 if-else 语句中修改变量', () => {
      const source = `
fun main() i32 {
  i32 x = 5;
  if (x > 10) {
    x = 20;
  } else {
    x = 30;
  }
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('30');
    });

    it('应该正确处理 if 语句中的多个变量', () => {
      const source = `
fun main() i32 {
  i32 a = 5;
  i32 b = 10;
  if (a < b) {
    i32 temp = a;
    a = b;
    b = temp;
  }
  printf("%d\\n", a);
  printf("%d\\n", b);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('10');
      expect(output).toContain('5');
    });
  });

  describe('边界情况', () => {
    it('应该正确处理零值条件', () => {
      const source = `
fun main() i32 {
  if (false) {
    printf("zero true\\n");
  } else {
    printf("zero false\\n");
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('zero false');
      expect(output).not.toContain('zero true');
    });

    it('应该正确处理负数条件', () => {
      const source = `
fun main() i32 {
  if (true) {
    printf("negative true\\n");
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('negative true');
    });

    it('应该正确处理浮点数条件', () => {
      const source = `
fun main() i32 {
  if (3.5 > 2.5) {
    printf("float greater\\n");
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('float greater');
    });

    it('应该正确处理相等比较的边界情况', () => {
      const source = `
fun main() i32 {
  if (5 == 5) {
    printf("equal\\n");
  }
  if (5 != 5) {
    printf("not equal\\n");
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('equal');
      expect(output).not.toContain('not equal');
    });
  });

  describe('空语句块', () => {
    it('应该正确处理空的 if 语句块', () => {
      const source = `
fun main() i32 {
  if (true) {
  }
  printf("after if\\n");
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('after if');
    });

    it('应该正确处理空的 else 语句块', () => {
      const source = `
fun main() i32 {
  if (false) {
    printf("if\\n");
  } else {
  }
  printf("after\\n");
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('after');
      expect(output).not.toContain('if');
    });
  });

  describe('多个 if 语句', () => {
    it('应该正确处理连续的 if 语句', () => {
      const source = `
fun main() i32 {
  if (true) {
    printf("first\\n");
  }
  if (true) {
    printf("second\\n");
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('first');
      expect(output).toContain('second');
    });

    it('应该正确处理混合的 if 和 if-else 语句', () => {
      const source = `
fun main() i32 {
    if (true) {
    printf("if1\\n");
  }
  if (false) {
    printf("if2\\n");
  } else {
    printf("else2\\n");
  }
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('if1');
      expect(output).toContain('else2');
      expect(output).not.toContain('if2');
    });
  });
});
