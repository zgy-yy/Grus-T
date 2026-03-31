import { createHash } from 'node:crypto';
import path from 'node:path';

/**
 * 由文件路径生成稳定且（在工程意义上）唯一的字符串。
 *
 * - 先规范化：resolve + 统一分隔符，避免 `./a` 与 `a` 被当成不同路径。
 * - 再用 SHA-256：相同输入必得相同输出；不同输入在密码学意义上可视为唯一。
 *
 * @param filePath 任意路径（相对或绝对）
 * @param length 返回十六进制字符串长度，最大 64；默认 64（完整摘要，碰撞可忽略）
 */
export function uniqueIdForFilePath(filePath: string, length: number = 64): string {
    const resolved = path.resolve(filePath);
    const normalized = resolved.split(path.sep).join('/');
    const digest = createHash('sha256').update(normalized, 'utf8').digest('hex');
    const n = Math.min(Math.max(1, length), digest.length);
    return digest.slice(0, n);
}

/**
 * 生成适合用作 LLVM 全局名等标识符的片段（仅 [a-zA-Z0-9_]，且不以数字开头）。
 */
export function uniqueSymbol(filePath: string, name: string, maxLen: number = 32): string {
    const hex = uniqueIdForFilePath(filePath, 64);
    const suffix = hex.slice(0, maxLen);
    return `${name}_${suffix}`;
}
