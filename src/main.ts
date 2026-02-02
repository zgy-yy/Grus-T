import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Grus } from './Grus.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const source =  fs.readFileSync(path.join(__dirname, 'grammar/program.e'), 'utf-8');
const grus = new Grus(source, (line, column) => {
    console.error(`error: ${line}:${column}`);
});
const irCode = grus.run();
console.log(irCode);