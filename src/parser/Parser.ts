import { Token } from "@/ast/Token";
import { ParserErrorHandler } from "./ErrorHandler";
import { TokenType } from "@/ast/TokenType";
import { AssignExpr, BinaryExpr, Expr, LiteralExpr, PostfixExpr, ThisExpr, UnaryExpr, VariableExpr } from "@/ast/Expr";
import { ExpressionStmt, Stmt, VarStmt } from "@/ast/Stmt";
import { PrimitiveType, GrusType } from "@/ast/GrusType";

class ParseError extends Error { }

class TypeParseError extends Error { }

/**
 * 运算符优先级
 */
enum Precedence {
    NONE,
    COMMA,       // ","
    ASSIGNMENT,  // "=" , "+=", "-=", "*=", "/=", "%=", "^=", "&=", "|=", ">>=", "<<="
    OR,          // "||"
    AND,         // "&&"
    BIT_OR,      // "|"
    BIT_XOR,     // "^"
    BIT_AND,     // "&"
    EQUALITY,    // "==", "!="
    COMPARISON,  // "<", ">", "<=", ">="
    SHIFT,       // ">>", "<<"
    TERM,        // "+", "-", 
    FACTOR,      // "*", "/", "%",
    UNARY,       // "!", "-" , "++", "--", "new", '~'
    CALL,        // ".", "()"

}


/**
 * 解析规则
 * 前缀表达式：用于解析主要表达式
 * 中缀表达式：用于解析二元运算符
 * 优先级：用于确定运算符的优先级
 */
type ParseRule = [
    prefix: ((token: Token) => Expr) | null,
    infix: ((left: Expr, token: Token) => Expr) | null,
    precedence: number
]

export class Parser {
    private current: number = 0;
    private readonly tokens: Token[];
    public parseError: ParserErrorHandler;

    private rules: Record<TokenType, ParseRule> = {
        [TokenType.Dot]: [null, null, Precedence.NONE],//.
        [TokenType.LeftParen]: [this.primary.bind(this), null, Precedence.NONE],//(

        [TokenType.Bang]: [this.unary.bind(this), null, Precedence.NONE],//!
        [TokenType.Minus]: [this.unary.bind(this), this.binary.bind(this), Precedence.TERM],//-
        [TokenType.PlusPlus]: [this.unary.bind(this), this.postfix.bind(this), Precedence.TERM],//++
        [TokenType.MinusMinus]: [this.unary.bind(this), this.postfix.bind(this), Precedence.TERM],//--
        [TokenType.New]: [null, null, Precedence.NONE],//new
        [TokenType.Tilde]: [null, null, Precedence.NONE],//~

        [TokenType.Star]: [null, this.binary.bind(this), Precedence.FACTOR],//*
        [TokenType.Slash]: [null, this.binary.bind(this), Precedence.FACTOR],// /
        [TokenType.Percent]: [null, this.binary.bind(this), Precedence.FACTOR],// %

        [TokenType.Plus]: [this.unary.bind(this), this.binary.bind(this), Precedence.TERM],//+

        [TokenType.GreaterGreater]: [null, this.binary.bind(this), Precedence.SHIFT],// >>
        [TokenType.LessLess]: [null, this.binary.bind(this), Precedence.SHIFT],// <<

        [TokenType.Greater]: [null, this.binary.bind(this), Precedence.COMPARISON],// >
        [TokenType.Less]: [null, this.binary.bind(this), Precedence.COMPARISON],// <
        [TokenType.GreaterEqual]: [null, this.binary.bind(this), Precedence.COMPARISON],// >=
        [TokenType.LessEqual]: [null, this.binary.bind(this), Precedence.COMPARISON],// <=

        [TokenType.EqualEqual]: [null, this.binary.bind(this), Precedence.EQUALITY],// == 
        [TokenType.BangEqual]: [null, this.binary.bind(this), Precedence.EQUALITY],// !=

        [TokenType.BitAnd]: [null, this.binary.bind(this), Precedence.BIT_AND],// &
        [TokenType.Caret]: [null, this.binary.bind(this), Precedence.BIT_XOR],// ^
        [TokenType.BitOr]: [null, this.binary.bind(this), Precedence.BIT_OR],// |
        [TokenType.And]: [null, this.binary.bind(this), Precedence.AND],// &&
        [TokenType.Or]: [null, this.binary.bind(this), Precedence.OR],// ||

        [TokenType.Equal]: [null, this.binary.bind(this), Precedence.ASSIGNMENT],// =
        [TokenType.PlusEqual]: [null, this.binary.bind(this), Precedence.ASSIGNMENT],// +=
        [TokenType.MinusEqual]: [null, this.binary.bind(this), Precedence.ASSIGNMENT],// -=
        [TokenType.StarEqual]: [null, this.binary.bind(this), Precedence.ASSIGNMENT],// *=
        [TokenType.SlashEqual]: [null, this.binary.bind(this), Precedence.ASSIGNMENT],// /=
        [TokenType.PercentEqual]: [null, this.binary.bind(this), Precedence.ASSIGNMENT],// %=
        [TokenType.CaretEqual]: [null, this.binary.bind(this), Precedence.ASSIGNMENT],// ^=
        [TokenType.AndEqual]: [null, this.binary.bind(this), Precedence.ASSIGNMENT],// &=
        [TokenType.OrEqual]: [null, this.binary.bind(this), Precedence.ASSIGNMENT],// |=    
        [TokenType.GreaterGreaterEqual]: [null, this.binary.bind(this), Precedence.ASSIGNMENT],// >>=
        [TokenType.LessLessEqual]: [null, this.binary.bind(this), Precedence.ASSIGNMENT],// <<=
        [TokenType.Comma]: [null, this.binary.bind(this), Precedence.COMMA],//,


        [TokenType.True]: [this.primary.bind(this), null, Precedence.NONE],// true
        [TokenType.False]: [this.primary.bind(this), null, Precedence.NONE],// false
        [TokenType.Number]: [this.primary.bind(this), null, Precedence.NONE],// number
        [TokenType.String]: [this.primary.bind(this), null, Precedence.NONE],// string 
        [TokenType.Null]: [this.primary.bind(this), null, Precedence.NONE],// null
        [TokenType.Identifier]: [this.primary.bind(this), null, Precedence.NONE],// identifier

        [TokenType.RightParen]: [null, null, Precedence.NONE],//)
        [TokenType.LeftBrace]: [null, null, Precedence.NONE],//{
        [TokenType.RightBrace]: [null, null, Precedence.NONE],//}


        [TokenType.This]: [null, null, Precedence.NONE],// this
        [TokenType.Super]: [null, null, Precedence.NONE],// super
        [TokenType.Let]: [null, null, Precedence.NONE],// let
        [TokenType.While]: [null, null, Precedence.NONE],// while
        [TokenType.Do]: [null, null, Precedence.NONE],// do
        [TokenType.Loop]: [null, null, Precedence.NONE],// loop
        [TokenType.Break]: [null, null, Precedence.NONE],// break       
        [TokenType.Continue]: [null, null, Precedence.NONE],// continue
        [TokenType.Semicolon]: [null, null, Precedence.NONE],// ;
        [TokenType.Question]: [null, null, Precedence.NONE],// ?
        [TokenType.Colon]: [null, null, Precedence.NONE],// :
        [TokenType.Class]: [null, null, Precedence.NONE],// class
        [TokenType.Else]: [null, null, Precedence.NONE],// else
        [TokenType.For]: [null, null, Precedence.NONE],// for
        [TokenType.Fun]: [null, null, Precedence.NONE],// fun
        [TokenType.EOF]: [null, null, Precedence.NONE],// eof
        [TokenType.If]: [null, null, Precedence.NONE],// if
        [TokenType.Return]: [null, null, Precedence.NONE],// return
    };

    constructor(tokens: Token[], error: ParserErrorHandler) {
        this.tokens = tokens;
        this.parseError = error;
    }

    /**
 * 解析 tokens 为语句列表
 * 将词法分析器生成的 token 序列解析为抽象语法树（AST）
 * 程序由变量声明和函数声明组成
 * @returns 解析后的语句列表，如果解析失败则返回 null
 */
    public parse(): Stmt[] | null {
        const statements: Stmt[] = [];
        while (!this.isAtEnd()) {
            try {
                const stmt = this.declaration();
                if (stmt) {
                    statements.push(stmt);
                }
            } catch (error) {
                if (error instanceof ParseError) {
                    this.synchronize();
                } else {
                    throw error;
                }
            }
        }
        return statements;
    }

    /**
     * 声明
     * declaration → varDecl | funDecl | statement
     * 声明由变量声明、函数声明和语句组成
     * 例如：
     * let a = 1;
     * Int a = 1;
     * fun add(a, b) {
     * return a + b;
     * }
     * print a;
     */
    private declaration(): Stmt | null {
        try {
            if (this.match(TokenType.Let)) {
                return this.varDeclaration(null);
            }
            if (this.check(TokenType.Identifier)) {
                const saved = this.current;
                const type = this.type(); // 解析类型表达式
                if (type === null) {//如果类型表达式解析失败，则回退
                    this.current = saved;
                } else {
                    return this.varDeclaration(type);
                }
            }
            if (this.match(TokenType.Fun)) {
                // return this.funDeclaration();
            }
            if (this.match(TokenType.Class)) {
                // return this.classDeclaration();
            }
            return this.statement();
        } catch (error) {
            if (error instanceof ParseError) {
                this.synchronize();
                return null;
            }
            throw error;
        }
    }


    /**
     * 解析 let 变量声明
     * let IDENTIFIER ( "=" expression )? ";" 
     */
    private varDeclaration(t: GrusType | null): VarStmt {
        const name = this.consume(TokenType.Identifier, "Expect variable name.");
        const initializer = this.match(TokenType.Equal) ? this.expression() : null;
        this.consume(TokenType.Semicolon, "Expect ';' after variable declaration.");
        // 修复Type参数不兼容tsc的报错，确保Type类型是本地ast/Type而非TypeScript的Type
        return new VarStmt(name, t, initializer);
    }

    private statement(): Stmt {
        return this.expressionStatement();
    }


    private expressionStatement(): Stmt {
        const expr = this.expression();
        this.consume(TokenType.Semicolon, "Expect ';' after expression.");
        return new ExpressionStmt(expr);
    }

    private expression(): Expr {
        return this.parsePrecedence(Precedence.COMMA);
    }

    private parsePrecedence(precedence: number): Expr {
        let token = this.advance();

        const prefix = this.rules[token.type][0];
        if (!prefix) {
            throw this.parseError(token, "Expect expression.");
        }
        let expr = prefix(token);


        while (precedence <= this.rules[this.peek().type][2]) {
            token = this.advance();
            const infix = this.rules[token.type][1];
            if (!infix) {
                throw this.parseError(token, "Expect expression..");
            }
            expr = infix(expr, token);
        }
        return expr;
    }


    private binary(left: Expr, operator: Token): Expr {
        const precedence = this.rules[operator.type][2]
        const assignOperators = [TokenType.Equal, TokenType.PlusEqual, TokenType.MinusEqual, TokenType.StarEqual, TokenType.SlashEqual, TokenType.PercentEqual, TokenType.CaretEqual, TokenType.AndEqual, TokenType.OrEqual, TokenType.GreaterGreaterEqual, TokenType.LessLessEqual]
        //赋值运算符 右结合
        if (assignOperators.includes(operator.type)) {
            //todo 赋值运算符需要检查左值是否可赋值
            if (left instanceof VariableExpr) {
                const right = this.parsePrecedence(precedence);
                return new AssignExpr(left.name, right);
            }
            this.parseError(operator, "Invalid assignment target.");
        }
        const right = this.parsePrecedence(precedence + 1);
        return new BinaryExpr(left, operator, right);
    }

    private unary(operator: Token): Expr {
        const right = this.parsePrecedence(Precedence.UNARY);
        return new UnaryExpr(operator, right);
    }
    private postfix(left: Expr, operator: Token): Expr {
        return new PostfixExpr(left, operator);
    }

    private primary(token: Token): Expr {
        switch (token.type) {
            case TokenType.True:
                return new LiteralExpr(true);
            case TokenType.False:
                return new LiteralExpr(false);
            case TokenType.Null:
                return new LiteralExpr(null);
            case TokenType.Number:
                return new LiteralExpr(parseFloat(token.lexeme));
            case TokenType.String:
                return new LiteralExpr(token.literal);
            case TokenType.This:
                return new ThisExpr(token);
            case TokenType.Identifier:
                return new VariableExpr(token);
            case TokenType.LeftParen:
                return this.expression();
            default:
                throw this.parseError(token, "Expect expression.");
        }
    }


    private type(): GrusType | null {
        const name = this.consume(TokenType.Identifier, "Expect type name.");
        if (this.check(TokenType.Identifier)) {
            return new PrimitiveType(name);
        }
        return null;
    }



    //辅助方法
    /**
 * 消费一个 token
 * 如果当前 token 匹配指定类型，则消费它并返回；否则抛出解析错误
 * @param type 期望的 token 类型
 * @param message 错误消息
 * @returns 消费的 token
 */
    private consume(type: TokenType, message: string): Token {
        if (this.match(type)) {
            return this.previous();
        }
        throw this.parseError(this.peek(), message);
    }

    /**
 * 匹配并消费一个 token
 * 检查当前 token 是否匹配任意一个指定类型，如果匹配则消费并返回 true
 * @param types 要匹配的 token 类型列表
 * @returns 是否匹配并消费了 token
 */
    private match(...types: TokenType[]): boolean {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }

    /**
     * 检查当前 token 类型
     * 检查当前 token 是否是指定类型，不消费 token
     * @param type 要检查的 token 类型
     * @returns 是否匹配
     */
    private check(type: TokenType): boolean {
        if (this.isAtEnd()) return false;
        return this.peek().type === type;
    }

    /**
 * 前进一个 token
 * 将当前指针向前移动一位，并返回移动前的 token
 * @returns 移动前的 token
 */
    private advance(): Token {
        if (!this.isAtEnd()) {
            this.current++;
        }
        return this.previous();
    }
    /**
 * 判断是否到达末尾
 * 检查是否已经解析完所有 token
 * @returns 是否到达末尾
 */
    private isAtEnd(): boolean {
        return this.peek().type === TokenType.EOF;
    }

    /**
     * 获取当前 token
     * 返回当前正在解析的 token，不移动指针
     * @returns 当前 token
     */
    private peek(): Token {
        return this.tokens[this.current];
    }

    /**
     * 获取上一个 token
     * 返回最近消费的 token
     * @returns 上一个 token
     */
    private previous(): Token {
        return this.tokens[this.current - 1];
    }


    /**
 * 同步
 * 当解析器遇到错误时，会尝试同步到下一个语句，继续解析后续代码
 * 
 * */
    private synchronize(): void {
        this.advance();
        while (!this.isAtEnd()) {
            if (this.previous().type === TokenType.Semicolon) return;
            switch (this.peek().type) {
                case TokenType.Class:
                case TokenType.Fun:
                case TokenType.Let:
                case TokenType.For:
                case TokenType.If:
                case TokenType.While:
                case TokenType.Return:
                    return
            }
            this.advance();
        }
    }

}