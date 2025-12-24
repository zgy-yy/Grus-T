import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';
import { createHash } from 'crypto';

const tempIrFile = join(process.cwd(), 'src/llvm ir/temp-ir.ll');
const irFile = join(process.cwd(), 'src/llvm ir/ir.ll');
const tempFile = join(process.cwd(), 'src/llvm ir/ir.ll.tmp');
const lockFile = join(process.cwd(), 'src/llvm ir/.formatting-temp.lock');
const stateFile = join(process.cwd(), 'src/llvm ir/.formatting-temp.state');
const optPath = '/opt/homebrew/opt/llvm/bin/opt';

// 计算文件内容哈希
function getFileHash(content) {
  return createHash('md5').update(content).digest('hex');
}

// 延迟函数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  try {
    // 检查源文件是否存在
    if (!existsSync(tempIrFile)) {
      console.log(`[${new Date().toLocaleTimeString()}] ⚠ temp-ir.ll 文件不存在`);
      process.exit(0);
    }

    // 检查是否有锁文件（正在格式化中）
    if (existsSync(lockFile)) {
      // 检查锁文件是否过期（超过5秒）
      const lockStats = statSync(lockFile);
      const lockAge = Date.now() - lockStats.mtimeMs;
      if (lockAge > 5000) {
        // 锁文件过期，删除它
        try {
          execSync(`rm "${lockFile}"`);
        } catch (e) {
          // 忽略删除错误
        }
      } else {
        process.exit(0);
      }
    }
    
    // 等待一小段时间，让文件系统稳定
    await sleep(100);
    
    // 读取 temp-ir.ll 文件内容
    const tempContent = readFileSync(tempIrFile, 'utf-8');
    const tempHash = getFileHash(tempContent);
    
    // 检查状态文件，如果内容哈希相同，说明已经处理过
    if (existsSync(stateFile)) {
      const lastHash = readFileSync(stateFile, 'utf-8').trim();
      if (lastHash === tempHash) {
        // 内容没有变化，跳过格式化
        process.exit(0);
      }
    }
    
    // 创建锁文件
    writeFileSync(lockFile, Date.now().toString(), 'utf-8');
    
    try {
      // 格式化 temp-ir.ll 到临时文件
      execSync(`${optPath} -S "${tempIrFile}" -o "${tempFile}"`, { stdio: 'pipe' });
      
      // 读取格式化后的内容
      const formattedContent = readFileSync(tempFile, 'utf-8');
      
      // 将格式化后的内容写入 ir.ll
      writeFileSync(irFile, formattedContent, 'utf-8');
      
      // 更新状态文件
      writeFileSync(stateFile, tempHash, 'utf-8');
      
      console.log(`[${new Date().toLocaleTimeString()}] ✓ temp-ir.ll 已格式化并写入 ir.ll`);
    } finally {
      // 清理锁文件和临时文件
      try {
        if (existsSync(lockFile)) {
          execSync(`rm "${lockFile}"`);
        }
        if (existsSync(tempFile)) {
          execSync(`rm "${tempFile}"`);
        }
      } catch (e) {
        // 忽略删除错误
      }
    }
  } catch (error) {
    // 清理锁文件
    try {
      if (existsSync(lockFile)) {
        execSync(`rm "${lockFile}"`);
      }
    } catch (e) {
      // 忽略删除错误
    }
    console.error(`[${new Date().toLocaleTimeString()}] ✗ 格式化失败:`, error.message);
    process.exit(1);
  }
}

main();

