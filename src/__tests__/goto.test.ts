import { describe, it, expect } from 'vitest';
import { compileAndRun } from './util';

describe('goto 语句测试', () => {
  describe('基本 goto 语句', () => {
    it('应该正确执行基本的 goto 跳转', () => {
      const source = `
fun main() i32 {
  printf("start\\n");
  goto skip;
  printf("middle\\n");
  skip:
  printf("end\\n");
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('start');
      expect(output).toContain('end');
      expect(output).not.toContain('middle');
    });

    it('应该正确执行向前跳转', () => {
      const source = `
fun main() i32 {
  printf("before\\n");
  goto target;
  printf("skipped\\n");
  target:
  printf("after\\n");
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('before');
      expect(output).toContain('after');
      expect(output).not.toContain('skipped');
    });

    it('应该正确处理多个 goto 跳转', () => {
      const source = `
fun main() i32 {
  printf("1\\n");
  goto label2;
  label1:
  printf("2\\n");
  goto end;
  label2:
  printf("3\\n");
  goto label1;
  end:
  printf("4\\n");
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('1');
      expect(output).toContain('3');
      expect(output).toContain('2');
      expect(output).toContain('4');
    });
  });

  describe('goto 与条件语句组合', () => {
    it('应该在 if 语句中使用 goto', () => {
      const source = `
fun main() i32 {
  i32 x = 5;
  if (x > 3) {
    goto large;
  }
  printf("small\\n");
  goto end;
  large:
  printf("large\\n");
  end:
  printf("done\\n");
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('large');
      expect(output).toContain('done');
      expect(output).not.toContain('small');
    });

    it('应该在 if-else 语句中使用 goto', () => {
      const source = `
fun main() i32 {
  i32 x = 2;
  if (x > 3) {
    goto large;
  } else {
    goto small;
  }
  large:
  printf("large\\n");
  goto end;
  small:
  printf("small\\n");
  end:
  printf("done\\n");
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('small');
      expect(output).toContain('done');
      expect(output).not.toContain('large');
    });

    it('应该正确处理嵌套 if 中的 goto', () => {
      const source = `
fun main() i32 {
  i32 x = 5;
  i32 y = 10;
  if (x > 3) {
    if (y > 5) {
      goto both;
    }
    goto xonly;
  }
  goto end;
  both:
  printf("both\\n");
  goto end;
  xonly:
  printf("xonly\\n");
  end:
  printf("done\\n");
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('both');
      expect(output).toContain('done');
      expect(output).not.toContain('xonly');
    });
  });

  describe('goto 与循环组合', () => {
    it('应该在 while 循环中使用 goto 跳出', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  while (i < 10) {
    printf("%d\\n", i);
    i = i + 1;
    if (i >= 3) {
      goto exit;
    }
  }
  exit:
  printf("exited\\n");
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
      expect(output).toContain('1');
      expect(output).toContain('2');
      expect(output).toContain('exited');
      expect(output).not.toContain('3');
    });

    it('应该在 for 循环中使用 goto 跳出', () => {
      const source = `
fun main() i32 {
  for (i32 i = 0; i < 10; i = i + 1) {
    printf("%d\\n", i);
    if (i >= 2) {
      goto exit;
    }
  }
  exit:
  printf("exited\\n");
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
      expect(output).toContain('1');
      expect(output).toContain('2');
      expect(output).toContain('exited');
    });

    it('应该在 loop 循环中使用 goto 跳出', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  loop {
    printf("%d\\n", i);
    i = i + 1;
    if (i >= 3) {
      goto exit;
    }
  }
  exit:
  printf("exited\\n");
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
      expect(output).toContain('1');
      expect(output).toContain('2');
      expect(output).toContain('exited');
    });
  });

  describe('goto 与变量操作', () => {
    it('应该在 goto 跳转前后修改变量', () => {
      const source = `
fun main() i32 {
  i32 x = 0;
  printf("%d\\n", x);
  x = 10;
  goto skip;
  x = 20;
  skip:
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('0');
      expect(output).toContain('10');
    });

    it('应该在标签处修改变量', () => {
      const source = `
fun main() i32 {
  i32 x = 5;
  goto modify;
  modify:
  x = 10;
  printf("%d\\n", x);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('10');
    });

    it('应该正确处理多个变量和 goto', () => {
      const source = `
fun main() i32 {
  i32 a = 1;
  i32 b = 2;
  goto swap;
  swap:
  i32 temp = a;
  a = b;
  b = temp;
  printf("%d,%d\\n", a, b);
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('2,1');
    });
  });

  describe('嵌套 goto', () => {
    it('应该正确处理嵌套的 goto 跳转', () => {
      const source = `
fun main() i32 {
  printf("start\\n");
  goto inner;
  outer:
  printf("outer\\n");
  goto end;
  inner:
  printf("inner\\n");
  goto outer;
  end:
  printf("end\\n");
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('start');
      expect(output).toContain('inner');
      expect(output).toContain('outer');
      expect(output).toContain('end');
    });

    it('应该正确处理多层嵌套的 goto', () => {
      const source = `
fun main() i32 {
  goto level3;
  level1:
  printf("level1\\n");
  goto end;
  level2:
  printf("level2\\n");
  goto level1;
  level3:
  printf("level3\\n");
  goto level2;
  end:
  printf("end\\n");
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('level3');
      expect(output).toContain('level2');
      expect(output).toContain('level1');
      expect(output).toContain('end');
    });
  });

  describe('goto 与标签位置', () => {
    it('应该正确处理标签在语句块开始处', () => {
      const source = `
fun main() i32 {
  start:
  printf("start\\n");
  goto end;
  end:
  printf("end\\n");
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('start');
      expect(output).toContain('end');
    });

    it('应该正确处理标签在语句块中间', () => {
      const source = `
fun main() i32 {
  printf("before\\n");
  middle:
  printf("middle\\n");
  goto end;
  end:
  printf("end\\n");
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('before');
      expect(output).toContain('middle');
      expect(output).toContain('end');
    });

    it('应该正确处理标签在语句块结束处', () => {
      const source = `
fun main() i32 {
  printf("before\\n");
  goto end;
  end:
  printf("end\\n");
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('before');
      expect(output).toContain('end');
    });

    it('应该正确处理标签后跟空语句', () => {
      const source = `
fun main() i32 {
  printf("before\\n");
  goto empty;
  empty:
  printf("after\\n");
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('before');
      expect(output).toContain('after');
    });
  });

  describe('goto 实现控制流', () => {
    it('应该使用 goto 实现 switch-case 效果', () => {
      const source = `
fun main() i32 {
  i32 x = 2;
  if (x == 1) {
    goto case1;
  }
  if (x == 2) {
    goto case2;
  }
  goto default;
  case1:
  printf("case1\\n");
  goto end;
  case2:
  printf("case2\\n");
  goto end;
  default:
  printf("default\\n");
  end:
  printf("done\\n");
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('case2');
      expect(output).toContain('done');
      expect(output).not.toContain('case1');
      expect(output).not.toContain('default');
    });

    it('应该使用 goto 实现错误处理', () => {
      const source = `
fun main() i32 {
  i32 x = 5;
  if (x < 0) {
    goto error;
  }
  printf("normal\\n");
  goto end;
  error:
  printf("error\\n");
  end:
  printf("done\\n");
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('normal');
      expect(output).toContain('done');
      expect(output).not.toContain('error');
    });

    it('应该使用 goto 实现循环', () => {
      const source = `
fun main() i32 {
  i32 i = 0;
  loop_start:
  if (i >= 3) {
    goto loop_end;
  }
  printf("%d\\n", i);
  i = i + 1;
  goto loop_start;
  loop_end:
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
  });

  describe('边界情况', () => {
    it('应该正确处理立即 goto', () => {
      const source = `
fun main() i32 {
  goto immediate;
  immediate:
  printf("immediate\\n");
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('immediate');
    });

    it('应该正确处理多个标签指向同一位置', () => {
      const source = `
fun main() i32 {
  goto label1;
  label1:
  label2:
  printf("both\\n");
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('both');
    });

    it('应该正确处理 goto 到函数开始', () => {
      const source = `
fun main() i32 {
  start:
  printf("start\\n");
  goto end;
  goto start;
  end:
  printf("end\\n");
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('start');
      expect(output).toContain('end');
    });

    it('应该正确处理 goto 在条件表达式中', () => {
      const source = `
fun main() i32 {
  i32 x = 5;
  if (x > 3) {
    goto positive;
  }
  goto negative;
  positive:
  printf("positive\\n");
  goto end;
  negative:
  printf("negative\\n");
  end:
  printf("done\\n");
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('positive');
      expect(output).toContain('done');
      expect(output).not.toContain('negative');
    });
  });

  describe('goto 与复杂表达式', () => {
    it('应该在复杂条件中使用 goto', () => {
      const source = `
fun main() i32 {
  i32 x = 10;
  i32 y = 5;
  if (x > 5 && y < 10) {
    goto success;
  }
  goto failure;
  success:
  printf("success\\n");
  goto end;
  failure:
  printf("failure\\n");
  end:
  printf("done\\n");
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('success');
      expect(output).toContain('done');
      expect(output).not.toContain('failure');
    });

    it('应该在算术表达式后使用 goto', () => {
      const source = `
fun main() i32 {
  i32 x = 5;
  i32 y = x + 3;
  if (y > 7) {
    goto large;
  }
  goto small;
  large:
  printf("large\\n");
  goto end;
  small:
  printf("small\\n");
  end:
  printf("done\\n");
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('large');
      expect(output).toContain('done');
      expect(output).not.toContain('small');
    });
  });

  describe('goto 与函数调用', () => {
    it('应该在函数调用后使用 goto', () => {
      const source = `
fun main() i32 {
  printf("before\\n");
  goto after;
  printf("skipped\\n");
  after:
  printf("after\\n");
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('before');
      expect(output).toContain('after');
      expect(output).not.toContain('skipped');
    });

    it('应该在 goto 跳转后调用函数', () => {
      const source = `
fun main() i32 {
  goto call;
  call:
  printf("called\\n");
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('called');
    });
  });

  describe('多个连续的 goto', () => {
    it('应该正确处理多个连续的 goto 语句', () => {
      const source = `
fun main() i32 {
  printf("start\\n");
  goto first;
  first:
  printf("first\\n");
  goto second;
  second:
  printf("second\\n");
  goto third;
  third:
  printf("third\\n");
  return 0;
}
`;
      const output = compileAndRun(source);
      expect(output).toContain('start');
      expect(output).toContain('first');
      expect(output).toContain('second');
      expect(output).toContain('third');
    });
  });
});
