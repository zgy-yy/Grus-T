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
import { Grus } from './Grus';

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
    const grus = new Grus(content, reportError);
    grus.run();
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
