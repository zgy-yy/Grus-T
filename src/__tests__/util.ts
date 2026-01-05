import { execSync } from 'child_process';
import { Grus } from '@/Grus';

const projectRoot = process.cwd();
const lliPath = '/opt/homebrew/opt/llvm/bin/lli';

/**
 * 编译源码字符串并运行生成的 IR 代码
 * @param source 源代码字符串
 * @returns 程序运行结果（去除首尾空白）
 * @throws 如果编译失败或执行失败
 */
export function compileAndRun(source: string): string {
  // 编译源代码为 IR
  const grus = new Grus(source, () => {})
  const irCode = grus.run();
  
  if (!irCode || irCode.trim() === '') {
    throw new Error('编译失败：未生成 IR 代码');
  }
  
  // 直接将 IR 代码通过 stdin 传递给 lli 运行
  try {
    const output = execSync(`${lliPath} -`, { 
      input: irCode,
      encoding: 'utf-8',
      cwd: projectRoot,
      stdio: 'pipe'
    });
    return output.trim();
  } catch (error: any) {
    throw new Error(`IR 执行失败: ${error.message}`);
  }
}

