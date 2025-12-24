import { execSync } from 'child_process';

const projectRoot = process.cwd();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  try {
    console.log('📦 编译中...');
    // 执行编译
    execSync('npm run compile', { stdio: 'inherit', cwd: projectRoot });
    
    console.log('\n🔧 格式化 IR...');
    // 等待一小段时间让文件写入完成
    await sleep(200);
    
    // 格式化 temp-ir.ll 到 ir.ll
    execSync('npm run format-temp-to-ir', { stdio: 'inherit', cwd: projectRoot });
    
    console.log('\n▶️  运行 IR...\n');
    // 运行 ir.ll
    execSync('npm run ir', { stdio: 'inherit', cwd: projectRoot });
  } catch (error) {
    console.error('\n❌ 执行失败:', error.message);
    process.exit(1);
  }
}

main();

