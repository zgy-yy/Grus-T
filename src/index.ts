import path from "path";
import { fileURLToPath } from "url";
import { Grus } from "./Grus";
import fs from 'fs';

// 在 ES 模块中获取 __dirname 的等价物
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const reportError = (line: number, column: number) => {
    console.error(`Error at line ${line}, column ${column}`);
};

const outFile = path.join(__dirname, 'llvm ir/ir.ll');
try {
    // 直接读取 .e 文件内容
    const programPath = path.join(__dirname, 'grammar/program.e');
    const content = fs.readFileSync(programPath, 'utf-8');
    const grus = new Grus(content, reportError);
    const code = grus.run();
    console.log(code);
    fs.writeFileSync(outFile, code);
} catch (e) {
    console.error(e);
}