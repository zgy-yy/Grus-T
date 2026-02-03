<template>
    <div class="code-display">
        <p class="code-line" v-for="(line, indexLine) in vContent" :key="`line-${indexLine}`">
            <span v-for="(char, index) in line" :key="`char-${indexLine}-${index}`"
                :class="{ 'cursor-error': isErrorAt(indexLine + 1, index + 1) }">
                {{ char }}
            </span>
        </p>
    </div>

</template>

<script setup lang="ts">
import { reactive } from 'vue';
import content from '@/grammar/program.e';
import { Scanner } from './parser/Scanner.ts';
import { Parser } from './parser/Parser.ts';
import { Resolver } from './execute/Resolver.ts';

// 错误光标位置
const errorCursor = reactive<{
    line: number;
    column: number;
}[]>([]);
const isErrorAt = (line: number, column: number) =>
    errorCursor.some(item => item.line === line && item.column === column);

// 代码内容
const vContent = content.split('\n');
// 解析代码
const reportError = (line: number, column: number) => {
    errorCursor.push({ line, column });
};

try {
    const scanner = new Scanner(content, reportError);
    const tokens = scanner.scanTokens();
    const parser = new Parser(tokens, (token, message) => {
        reportError(token.line, token.column);
        console.error(`parser error [${token.line}:${token.column}] ${message}`);
    });
    const statements = parser.parse();
    if (statements) {
        const resolver = new Resolver((token, message) => {
            reportError(token.line, token.column);
            console.error(`resolver error [${token.line}:${token.column}] ${message}`);
        });
        try {
            resolver.resolveProgram(statements);
            console.log(statements);
        } catch (e) {
            console.error(e);
        }
    }
} catch (e) {
    console.error(e);
}


</script>

<style scoped>
* {
    margin: 0;
    padding: 0;
}

.code-display {
    font-family: monospace;
    font-size: 14px;
    line-height: 1.5;
    white-space: pre-wrap;
}

.cursor-error {
    color: red;
}

.expression-display {
    font-family: monospace;
    font-size: 14px;
    line-height: 1.5;
    padding: 10px;
    background: #f5f5f5;
    border-radius: 4px;
    margin-top: 20px;
}
</style>
