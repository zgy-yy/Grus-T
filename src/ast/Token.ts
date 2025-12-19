import { TokenType } from "@/ast/TokenType";
import { GrusValue } from "./GrusValue";

// Token 类型定义
export class Token {
  constructor(
    public readonly type: TokenType,
    public readonly lexeme: string, // 词素
    public readonly literal: GrusValue,// 字面量
    public readonly line: number,// 行号
    public column: number// 列号
  ) {
  }

  toString(): string {
    return `${this.type} ${this.lexeme} ${this.literal ? this.literal : ''}`;
  }
}



