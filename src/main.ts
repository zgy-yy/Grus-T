import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Grus } from './Grus.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const source =  fs.readFileSync(path.join(__dirname, 'grammar/program.e'), 'utf-8');
const output = path.join(__dirname, 'llvm ir/ir.ll');
const grus = new Grus(source, (line, column) => {
    console.error(`error: ${line}:${column}`);
});
const irCode = grus.run();
fs.writeFileSync(output, irCode);
console.log(irCode);
