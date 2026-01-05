import { Token } from '@/ast/Token.ts';
import { TokenType } from '@/ast/TokenType.ts';
import { ScannerErrorHandler } from './ErrorHandler';
import { GrusValue } from '@/ast/GrusValue';


// 关键字映射
const keywords = new Map<string, TokenType>([
  ['new', TokenType.New],
  ['let', TokenType.Let],
  ['class', TokenType.Class],
  ['super', TokenType.Super],
  ['this', TokenType.This],
  ['if', TokenType.If],
  ['else', TokenType.Else],

  ['for', TokenType.For],
  ['while', TokenType.While],
  ['do', TokenType.Do],
  ['loop', TokenType.Loop],
  ['break', TokenType.Break],
  ['continue', TokenType.Continue],
  ['fun', TokenType.Fun],
  ['return', TokenType.Return],

  ['null', TokenType.Null],

  ['true', TokenType.True],
  ['false', TokenType.False],
]);

// 词法分析器（Scanner）
export class Scanner {
  private tokens: Token[] = [];
  private start = 0;
  private current = 0;
  private line = 1;
  private column = 0;
  private error: ScannerErrorHandler;
  constructor(private source: string, _error: ScannerErrorHandler) {
    this.source = source;
    this.error = _error;
  }

  // 扫描所有 token
  scanTokens(): Token[] {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push(new Token(TokenType.EOF, '', null, this.line, this.column));
    console.log(this.tokens)
    return this.tokens;
  }

  // 扫描单个 token
  private scanToken(): void {
    const c = this.advance();

    switch (c) {
      case '(':
        this.addToken(TokenType.LeftParen);
        break;
      case ')':
        this.addToken(TokenType.RightParen);
        break;
      case '{':
        this.addToken(TokenType.LeftBrace);
        break;
      case '}':
        this.addToken(TokenType.RightBrace);
        break;
      case ',':
        this.addToken(TokenType.Comma);
        break;
      case '.':
        this.addToken(TokenType.Dot);
        break;
      case '-':
        this.addToken(this.match('-') ? TokenType.MinusMinus : TokenType.Minus);
        break;
      case '+':
        this.addToken(this.match('+') ? TokenType.PlusPlus : TokenType.Plus);
        break;
      case '?':
        this.addToken(TokenType.Question);
        break;
      case ':':
        this.addToken(TokenType.Colon);
        break;
      case ';':
        this.addToken(TokenType.Semicolon);
        break;
      case '^':
        this.addToken(TokenType.Caret);
        break;
      case '~':
        this.addToken(TokenType.Tilde);
        break;
      case '%':
        this.addToken(TokenType.Percent);
        break;
      case '&':
        this.addToken(this.match('&') ? TokenType.And : TokenType.BitAnd);
        break;
      case '|':
        this.addToken(this.match('|') ? TokenType.Or : TokenType.BitOr);
        break;
      case '*':
        this.addToken(TokenType.Star);
        break;
      case '!':
        this.addToken(this.match('=') ? TokenType.BangEqual : TokenType.Bang);
        break;
      case '=':
        this.addToken(this.match('=') ? TokenType.EqualEqual : TokenType.Equal);
        break;
      case '<':
        this.addToken(this.match('=') ? TokenType.LessEqual : this.match('<') ? TokenType.LessLess : TokenType.Less);
        break;
      case '>':
        this.addToken(
          this.match('=') ? TokenType.GreaterEqual : this.match('>') ? TokenType.GreaterGreater : TokenType.Greater
        );
        break;
      case '/':
        if (this.match('/')) {
          // 注释：一直读到行尾
          while (this.peek() !== '\n' && !this.isAtEnd()) {
            this.advance();
          }
        } else if (this.match('*')) {
          this.multiLineComment();
        } else {
          this.addToken(TokenType.Slash);
        }
        break;
      case ' ':
      case '\r':
      case '\t':
        // 忽略空白字符
        break;
      case '\n':
        this.line++;
        this.column = 0;
        break;
      case '"':
        this.string();
        break;
      default:
        if (isDigit(c)) {
          this.number();
        } else if (isAlpha(c)) {
          this.identifier();
        } else {
          this.error(this.line, this.column, `Unexpected character: ${c}`);
        }
        break;
    }
  }

  private multiLineComment(): void {
    while (!(this.match('*') && this.match('/')) && !this.isAtEnd()) {
      if (this.peek() === '\n') {
        this.line++;
        this.column = 0;
      }
      this.advance();
    }
  }

  // 处理字符串字面量
  private string(): void {
    while (this.peek() !== '"' && !this.isAtEnd()) {
      if (this.peek() === '\n') {
        this.line++;
        this.column = -1;// 因为换行符也算一个字符
      }
      this.advance();
    }

    if (this.isAtEnd()) {
      this.error(this.line, this.column, `Unterminated string.`);
    }

    // 闭合引号
    this.advance();

    // 提取字符串值（去掉引号）
    const value = this.source.substring(this.start + 1, this.current - 1);
    this.addToken(TokenType.String, value);
  }

  // 处理数字字面量
  private number(): void {
    const hexadecimal = () => {
      while (isHexDigit(this.peek())) {
        this.advance();
      }
    }
    const octal = () => {
      while (isOctalDigit(this.peek())) {
        this.advance();
      }
    }
    const binary = () => {
      while (isBinaryDigit(this.peek())) {
        this.advance();
      }
    }
    if (['x', 'o', 'b'].includes(this.peek())) {
      let base = 10;
      switch (this.peek()) {
        case 'x':
          this.advance();
          hexadecimal();
          base = 16;
          break;
        case 'o':
          this.advance();
          octal();
          base = 8;
          break;
        case 'b':
          this.advance();
          binary();
          base = 2;
          break
        default:
          this.error(this.line, this.column, `Invalid number literal: ${this.source.substring(this.start, this.current)}`);
          break;
      }
      const num=this.source.substring(this.start, this.current).slice(2);
      const value = parseInt(num, base);
      this.addToken(TokenType.Number, value);
      return;
    }


    while (isDigit(this.peek())) {
      this.advance();
    }

    // 处理小数部分
    if (this.peek() === '.' && isDigit(this.peekNext())) {
      // 消费 '.'
      this.advance();

      while (isDigit(this.peek())) {
        this.advance();
      }
    }

    const value = parseFloat(this.source.substring(this.start, this.current));
    this.addToken(TokenType.Number, value);

  }

  // 处理标识符和关键字
  private identifier(): void {
    while (isAlphaNumeric(this.peek())) {
      this.advance();
    }

    const text = this.source.substring(this.start, this.current);
    const type = keywords.get(text) || TokenType.Identifier;
    this.addToken(type);
  }



  // 辅助方法
  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private addToken(type: TokenType, literal: GrusValue = null): void {
    const text = this.source.substring(this.start, this.current);
    this.tokens.push(new Token(type, text, literal, this.line, this.column));
  }

  // 消费一个字符
  private advance(): string {
    const c = this.source[this.current++];
    this.column++;
    return c;
  }

  // 匹配一个字符
  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source[this.current] !== expected) return false;

    this.current++;
    this.column++;
    return true;
  }

  private peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.source[this.current];
  }

  private peekNext(): string {
    const next = this.current + 1;
    if (next >= this.source.length) return '\0';
    return this.source[next];
  }

}



function isDigit(c: string): boolean {
  return c >= "0" && c <= "9";
}

function isHexDigit(c: string): boolean {
  return (c >= "0" && c <= "9") || (c >= "a" && c <= "f") || (c >= "A" && c <= "F");
}

function isOctalDigit(c: string): boolean {
  return c >= "0" && c <= "7";
}
function isBinaryDigit(c: string): boolean {
  return c === "0" || c === "1";
}

function isAlpha(c: string): boolean {
  return (c >= "a" && c <= "z") ||
    (c >= "A" && c <= "Z") ||
    c === "_";
}

function isAlphaNumeric(c: string): boolean {
  return isAlpha(c) || isDigit(c);
}
