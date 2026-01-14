import { describe, it, expect } from 'vitest';
import { compileAndRun } from './util';

describe('do-while 循环测试', () => {
    describe('基本 do-while 循环', () => {
        it('应该正确执行基本的 do-while 循环', () => {
            const source = `
fun main() i32 {
  i32 i = 0;
  do {
    printf("%d\\n", i);
    i = i + 1;
  } while (i < 5);
}
`;
            const output = compileAndRun(source);
            expect(output).toContain('0');
            expect(output).toContain('1');
            expect(output).toContain('2');
            expect(output).toContain('3');
            expect(output).toContain('4');
        });

        it('应该至少执行一次循环体（即使条件为假）', () => {
            const source = `
fun main() i32 {
  i32 i = 10;
  do {
    printf("%d\\n", i);
    i = i + 1;
  } while (i < 5);
}
`;
            const output = compileAndRun(source);
            // 即使条件为假，也应该执行一次
            expect(output).toContain('10');
            expect(output).not.toContain('11');
        });

        it('应该正确处理单次循环', () => {
            const source = `
fun main() i32 {
  i32 i = 0;
  do {
    printf("%d\\n", i);
    i = i + 1;
  } while (i < 1);
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
  do {
    printf("%d\\n", i);
    i = i + 1;
  } while (i < 3);
}
`;
            const output = compileAndRun(source);
            expect(output).toContain('0');
            expect(output).toContain('1');
            expect(output).toContain('2');
        });
    });

    describe('do-while 循环的条件', () => {
        it('应该正确处理 <= 条件', () => {
            const source = `
fun main() i32 {
  i32 i = 0;
  do {
    printf("%d\\n", i);
    i = i + 1;
  } while (i <= 3);
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
  do {
    printf("%d\\n", i);
    i = i - 1;
  } while (i > 2);
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
  do {
    printf("%d\\n", i);
    i = i - 1;
  } while (i >= 1);
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
  do {
    printf("%d\\n", i);
    i = i + 1;
  } while (i == 0);
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
  do {
    printf("%d\\n", i);
    i = i + 1;
  } while (i != 3);
}
`;
            const output = compileAndRun(source);
            expect(output).toContain('0');
            expect(output).toContain('1');
            expect(output).toContain('2');
        });
    });

    describe('边界情况', () => {
        it('应该正确处理零值条件（至少执行一次）', () => {
            const source = `
fun main() i32 {
  i32 i = 0;
  do {
    printf("%d\\n", i);
    i = i + 1;
  } while (0==1);
}
`;
            const output = compileAndRun(source);
            // 即使条件是 0（假），也应该执行一次
            expect(output).toContain('0');
            expect(output).not.toContain('1');
        });

        it('应该正确处理负数条件', () => {
            const source = `
fun main() i32 {
  i32 i = -3;
  do {
    printf("%d\\n", i);
    i = i + 1;
  } while (i < 0);
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
  do {
    printf("%d\\n", i);
    i = i + 1;
  } while (i < 10);
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
  do {
    printf("%.0f\\n", f);
    f = f + 1.0;
  } while (f < 3.0);
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
  do {
    printf("%d\\n", count);
    count = count + 1;
    if (count >= 3) {
      flag = false;
    }
  } while (flag);
}
`;
            const output = compileAndRun(source);
            expect(output).toContain('0');
            expect(output).toContain('1');
            expect(output).toContain('2');
        });
    });

    describe('嵌套 do-while 循环', () => {
        it('应该正确处理两层嵌套 do-while 循环', () => {
            const source = `
fun main() i32 {
  i32 i = 0;
  do {
    i32 j = 0;
    do {
      printf("%d,%d\\n", i, j);
      j = j + 1;
    } while (j < 2);
    i = i + 1;
  } while (i < 2);
}
`;
            const output = compileAndRun(source);
            expect(output).toContain('0,0');
            expect(output).toContain('0,1');
            expect(output).toContain('1,0');
            expect(output).toContain('1,1');
        });

        it('应该正确处理三层嵌套 do-while 循环', () => {
            const source = `
fun main() i32 {
  i32 i = 0;
  do {
    i32 j = 0;
    do {
      i32 k = 0;
      do {
        printf("%d\\n", i + j + k);
        k = k + 1;
      } while (k < 2);
      j = j + 1;
    } while (j < 2);
    i = i + 1;
  } while (i < 2);
}
`;
            const output = compileAndRun(source);
            // 应该输出各种组合的和
            expect(output).toContain('0');
            expect(output).toContain('1');
            expect(output).toContain('2');
            expect(output).toContain('3');
        });
    });

    describe('do-while 与其他循环组合', () => {
        it('应该正确处理 do-while 和 for 循环组合', () => {
            const source = `
fun main() i32 {
  i32 i = 0;
  do {
    for (i32 j = 0; j < 2; j = j + 1) {
      printf("%d,%d\\n", i, j);
    }
    i = i + 1;
  } while (i < 2);
}
`;
            const output = compileAndRun(source);
            expect(output).toContain('0,0');
            expect(output).toContain('0,1');
            expect(output).toContain('1,0');
            expect(output).toContain('1,1');
        });

        it('应该正确处理 do-while 和 while 循环组合', () => {
            const source = `
fun main() i32 {
  i32 i = 0;
  do {
    i32 j = 0;
    while (j < 2) {
      printf("%d,%d\\n", i, j);
      j = j + 1;
    }
    i = i + 1;
  } while (i < 2);
}
`;
            const output = compileAndRun(source);
            expect(output).toContain('0,0');
            expect(output).toContain('0,1');
            expect(output).toContain('1,0');
            expect(output).toContain('1,1');
        });
    });

    describe('do-while 与条件语句组合', () => {
        it('应该在 do-while 循环中使用 if 语句', () => {
            const source = `
fun main() i32 {
  i32 i = 0;
  do {
    if (i % 2 == 0) {
      printf("even:%d\\n", i);
    } else {
      printf("odd:%d\\n", i);
    }
    i = i + 1;
  } while (i < 5);
}
`;
            const output = compileAndRun(source);
            expect(output).toContain('even:0');
            expect(output).toContain('odd:1');
            expect(output).toContain('even:2');
            expect(output).toContain('odd:3');
            expect(output).toContain('even:4');
        });

        it('应该在 do-while 循环中使用 if-else 链', () => {
            const source = `
fun main() i32 {
  i32 i = 0;
  do {
    if (i < 2) {
      printf("small:%d\\n", i);
    } else if (i < 4) {
      printf("medium:%d\\n", i);
    } else {
      printf("large:%d\\n", i);
    }
    i = i + 1;
  } while (i < 6);
}
`;
            const output = compileAndRun(source);
            expect(output).toContain('small:0');
            expect(output).toContain('small:1');
            expect(output).toContain('medium:2');
            expect(output).toContain('medium:3');
            expect(output).toContain('large:4');
            expect(output).toContain('large:5');
        });
    });


    describe('变量操作', () => {
        it('应该在循环中修改条件变量', () => {
            const source = `
fun main() i32 {
  i32 i = 0;
  do {
    printf("%d\\n", i);
    i = i + 2;
  } while (i < 6);
}
`;
            const output = compileAndRun(source);
            expect(output).toContain('0');
            expect(output).toContain('2');
            expect(output).toContain('4');
        });

        it('应该在循环中修改多个变量', () => {
            const source = `
fun main() i32 {
  i32 a = 0;
  i32 b = 10;
  do {
    printf("%d,%d\\n", a, b);
    a = a + 1;
    b = b - 1;
  } while (a < 3);
}
`;
            const output = compileAndRun(source);
            expect(output).toContain('0,10');
            expect(output).toContain('1,9');
            expect(output).toContain('2,8');
        });

        it('应该正确处理后缀递增操作符', () => {
            const source = `
fun main() i32 {
  i32 i = 0;
  do {
    printf("%d\\n", i);
    i++;
  } while (i < 3);
}
`;
            const output = compileAndRun(source);
            expect(output).toContain('0');
            expect(output).toContain('1');
            expect(output).toContain('2');
        });

        it('应该正确处理后缀递减操作符', () => {
            const source = `
fun main() i32 {
  i32 i = 5;
  do {
    printf("%d\\n", i);
    i--;
  } while (i > 2);
}
`;
            const output = compileAndRun(source);
            expect(output).toContain('5');
            expect(output).toContain('4');
            expect(output).toContain('3');
        });
    });

    describe('边界值和特殊情况', () => {
        it('应该正确处理条件始终为真的情况（使用变量控制）', () => {
            const source = `
fun main() i32 {
  i32 i = 0;
  bool running = true;
  do {
    printf("%d\\n", i);
    i = i + 1;
    if (i >= 3) {
      running = false;
    }
  } while (running);
}
`;
            const output = compileAndRun(source);
            expect(output).toContain('0');
            expect(output).toContain('1');
            expect(output).toContain('2');
        });



        it('应该正确处理循环体中的变量声明', () => {
            const source = `
fun main() i32 {
  i32 i = 0;
  do {
    i32 temp = i * 2;
    printf("%d\\n", temp);
    i = i + 1;
  } while (i < 3);
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
  do {
    printf("%d\\n", i);
    i = i + 1;
  } while (i < 2);
  printf("end\\n");
}
`;
            const output = compileAndRun(source);
            expect(output).toContain('start');
            expect(output).toContain('0');
            expect(output).toContain('1');
            expect(output).toContain('end');
        });
    });

    describe('多个连续的 do-while 循环', () => {
        it('应该正确处理多个连续的 do-while 循环', () => {
            const source = `
fun main() i32 {
  i32 i = 0;
  do {
    printf("A%d\\n", i);
    i = i + 1;
  } while (i < 2);
  
  i32 j = 0;
  do {
    printf("B%d\\n", j);
    j = j + 1;
  } while (j < 2);
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
