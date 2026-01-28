import { Token } from "@/ast/Token";
import { ParserErrorHandler } from "./ErrorHandler";
import { TokenType } from "@/ast/TokenType";
import { AssignExpr, BinaryExpr, CallExpr, Expr, LiteralExpr, PostfixExpr, PrefixExpr, ThisExpr, UnaryExpr, VariableExpr } from "@/ast/Expr";
import { BlockStmt, BreakStmt, ContinueStmt, DoWhileStmt, ExpressionStmt, ForStmt, FunctionStmt, GotoStmt, IfStmt, LabelStmt, LoopStmt, Parameter, ReturnStmt, Stmt, Variable, VarStmt, WhileStmt } from "@/ast/Stmt";
import { PrimitiveTypeExpr, TypeExpr } from "@/ast/TypeExpr";

class SyntaxError extends Error {
    public token: Token;
    constructor(token: Token, message: string) {
        super(message);
        this.token = token;

    }
}

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
    public errorHandler: ParserErrorHandler;
    private PARSE_ERROR: boolean = false;

    private rules: Record<TokenType, ParseRule> = {
        [TokenType.Dot]: [null, null, Precedence.NONE],//.
        [TokenType.LeftParen]: [this.primary.bind(this), this.call.bind(this), Precedence.CALL],//(

        [TokenType.Bang]: [this.unary.bind(this), null, Precedence.NONE],//!
        [TokenType.Minus]: [this.unary.bind(this), this.binary.bind(this), Precedence.TERM],//-
        [TokenType.PlusPlus]: [this.prefix.bind(this), this.postfix.bind(this), Precedence.UNARY],//++
        [TokenType.MinusMinus]: [this.prefix.bind(this), this.postfix.bind(this), Precedence.UNARY],//--
        [TokenType.New]: [null, null, Precedence.NONE],//new
        [TokenType.Tilde]: [this.unary.bind(this), null, Precedence.NONE],//~

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
        [TokenType.Question]: [null, null, Precedence.NONE],// ?

        [TokenType.This]: [null, null, Precedence.NONE],// this
        [TokenType.Super]: [null, null, Precedence.NONE],// super
        [TokenType.Let]: [null, null, Precedence.NONE],// let
        [TokenType.While]: [null, null, Precedence.NONE],// while
        [TokenType.Do]: [null, null, Precedence.NONE],// do
        [TokenType.Loop]: [null, null, Precedence.NONE],// loop
        [TokenType.Break]: [null, null, Precedence.NONE],// break       
        [TokenType.Continue]: [null, null, Precedence.NONE],// continue
        [TokenType.Semicolon]: [null, null, Precedence.NONE],// ;

        [TokenType.Colon]: [null, null, Precedence.NONE],// :
        [TokenType.Class]: [null, null, Precedence.NONE],// class
        [TokenType.Struct]: [null, null, Precedence.NONE],// struct
        [TokenType.Else]: [null, null, Precedence.NONE],// else
        [TokenType.For]: [null, null, Precedence.NONE],// for
        [TokenType.Fun]: [null, null, Precedence.NONE],// fun
        [TokenType.EOF]: [null, null, Precedence.NONE],// eof
        [TokenType.If]: [null, null, Precedence.NONE],// if
        [TokenType.Return]: [null, null, Precedence.NONE],// return
        [TokenType.Goto]: [null, null, Precedence.NONE],// goto
    };

    constructor(tokens: Token[], errorHandler: ParserErrorHandler) {
        this.tokens = tokens;
        this.errorHandler = errorHandler;
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
            const stmt = this.declaration(true);
            if (stmt) {
                statements.push(stmt);
            }
        }
        if (this.PARSE_ERROR) {
            return null;
        }
        return statements;
    }

    /**
     * 声明
     * declaration → varDecl | funDecl 
     * 声明由变量声明、函数声明和语句组成
     */
    private declaration(program: boolean = false): Stmt | null {
        try {
            if (this.match(TokenType.Let)) {
                return this.varDeclaration(null);
            }
            if (this.typeDeclarCheck()) {
                const type = this.type();
                return this.varDeclaration(type);
            }
            if (this.match(TokenType.Fun)) {
                return this.funDeclaration();
            }
            if (this.match(TokenType.Class)) {
                // return this.classDeclaration();
            }

            if (program) {
                throw this.error(this.peek(), "Expect declaration.");
            }
            return this.statement();
        }
        catch (error) {
            if (error instanceof SyntaxError) {
                this.synchronize();
                return null
            } else {
                throw error;
            }
        }

    }


    /**
     * 解析 let 变量声明
     * let IDENTIFIER ( "=" expression )? ";" 
     */
    private varDeclaration(t: TypeExpr | null): VarStmt {
        const vars: Variable[] = [];
        do {
            const name = this.consume(TokenType.Identifier, "Expect variable name.");
            const initializer = this.match(TokenType.Equal) ? this.expression(Precedence.ASSIGNMENT) : null;
            const type = t as unknown as TypeExpr;
            vars.push(new Variable(name, type, initializer));
        } while (this.match(TokenType.Comma));
        this.consume(TokenType.Semicolon, "Expect ';' after variable declaration.");
        return new VarStmt(vars);
    }


    private funDeclaration(): FunctionStmt {
        const name = this.consume(TokenType.Identifier, "Expect function name.");
        this.consume(TokenType.LeftParen, "Expect '(' after function name.");
        const parameters: Parameter[] = [];
        while (!this.check(TokenType.RightParen)) {
            if (parameters.length >= 255) {
                throw this.error(this.previous(), "Can't have more than 255 parameters.");
            }
            const parameter = this.parameter();
            parameters.push(...parameter);
        }
        this.consume(TokenType.RightParen, "Expect ')' after parameters.");
        let returnType: TypeExpr | null = null;
        if (this.check(TokenType.LeftBrace)) {
            const token = this.previous();
            returnType = new PrimitiveTypeExpr(new Token(TokenType.Identifier, "void", null, token.line, token.column));
        } else {
            returnType = this.type();
        }
        this.consume(TokenType.LeftBrace, "Expect '{' after parameters.");
        const body = this.block();
        return new FunctionStmt(name, parameters, returnType, body, this.previous());
    }

    /**
     * 解析参数
     * parameter → typeExpr IDENTIFIER ( "=" expression )?
     */
    private parameter(): Parameter[] {
        const type = this.type();
        const parameters: Parameter[] = [];
        do {
            if (this.typeDeclarCheck()) {
                break;
            }
            const name = this.consume(TokenType.Identifier, "Expect parameter name.");
            const defaultValue = this.match(TokenType.Equal) ? this.expression(Precedence.ASSIGNMENT) : null;
            parameters.push(new Parameter(name, type, defaultValue));
        } while (this.match(TokenType.Comma));
        return parameters;
    }

    private block(): Stmt[] {
        const statements: Stmt[] = [];
        while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
            const stmt = this.declaration();
            if (stmt) {
                statements.push(stmt);
            }
        }
        this.consume(TokenType.RightBrace, "Expect '}' after block.");
        return statements;
    }

    private statement(): Stmt {
        if (this.match(TokenType.LeftBrace)) {
            const block = this.block();
            return new BlockStmt(block);
        } if (this.match(TokenType.If)) {
            return this.ifStatement();
        } if (this.match(TokenType.While)) {
            return this.whileStatement();
        } if (this.match(TokenType.For)) {
            return this.forStatement();
        } if (this.match(TokenType.Do)) {
            return this.doWhileStatement();
        } if (this.match(TokenType.Loop)) {
            return this.loopStatement();
        } if (this.match(TokenType.Continue)) {
            this.consume(TokenType.Semicolon, "Expect ';' after continue.");
            const keyword = this.previous();
            return new ContinueStmt(keyword);
        } if (this.match(TokenType.Break)) {
            this.consume(TokenType.Semicolon, "Expect ';' after break.");
            const keyword = this.previous();
            return new BreakStmt(keyword);
        } if (this.match(TokenType.Return)) {
            const keyword = this.previous();
            const value = this.check(TokenType.Semicolon) ? null : this.expression();
            this.consume(TokenType.Semicolon, "Expect ';' after return.");
            return new ReturnStmt(keyword, value);
        } if (this.match(TokenType.Identifier)) {
            const label = this.previous();
            if (this.check(TokenType.Colon)) {
                this.consume(TokenType.Colon, "Expect ':' after label.");
                const body = this.declaration();
                return new LabelStmt(label, body);
            }
            this.back();
        } if (this.match(TokenType.Goto)) {
            const label = this.consume(TokenType.Identifier, "Expect label name.");
            this.consume(TokenType.Semicolon, "Expect ';' after goto.");
            return new GotoStmt(label);
        }
        return this.expressionStatement();
    }

    /**
     * 解析 if 语句
     * if (expression) statement (else statement)?
     */
    private ifStatement(): IfStmt {
        this.consume(TokenType.LeftParen, "Expect '(' after 'if'.");
        const condition = this.expression();
        this.consume(TokenType.RightParen, "Expect ')' after condition.");
        const thenBranch = this.statement();
        const elseBranch = this.match(TokenType.Else) ? this.statement() : null;
        return new IfStmt(condition, thenBranch, elseBranch);
    }

    /**
     * 解析 while 语句
     * while (expression) statement
     */
    private whileStatement(): WhileStmt {
        this.consume(TokenType.LeftParen, "Expect '(' after 'while'.");
        const condition = this.expression();
        this.consume(TokenType.RightParen, "Expect ')' after condition.");
        const body = this.statement();
        return new WhileStmt(condition, body);
    }

    private doWhileStatement(): DoWhileStmt {
        const body = this.statement();
        this.consume(TokenType.While, "Expect 'while' in 'do/while' loop");
        this.consume(TokenType.LeftParen, "Expect '(' after 'while'.");
        const condition = this.expression();
        this.consume(TokenType.RightParen, "Expect ')' after condition.");
        this.consume(TokenType.Semicolon, "Expect ';' after condition.");
        return new DoWhileStmt(condition, body);
    }
    private loopStatement(): LoopStmt {
        const body = this.statement();
        return new LoopStmt(body);
    }

    /**
     * 解析 for 语句
     * for (declaration | expression; expression; expression) statement
     */
    private forStatement(): ForStmt {
        this.consume(TokenType.LeftParen, "Expect '(' after 'for'.");
        let initializer: Stmt | null = null;
        if (this.match(TokenType.Semicolon)) {
            initializer = null;
        } else if (this.match(TokenType.Let)) {
            initializer = this.varDeclaration(null);
        } else if (this.typeDeclarCheck()) {
            const type = this.type();
            initializer = this.varDeclaration(type);
        } else {
            initializer = this.expressionStatement();
        }
        const condition = this.check(TokenType.Semicolon) ? new LiteralExpr(true) : this.expression();
        this.consume(TokenType.Semicolon, "Expect ';' after condition.");
        const increment = this.check(TokenType.RightParen) ? null : this.expression();
        this.consume(TokenType.RightParen, "Expect ')' after condition.");
        const body = this.statement();
        return new ForStmt(initializer, condition, increment, body);
    }
    /**
     * 解析表达式语句
     * expression ";"
     */
    private expressionStatement(): Stmt {
        const expr = this.expression();
        this.consume(TokenType.Semicolon, "Expect ';' after expression.");
        return new ExpressionStmt(expr);
    }

    //默认优先级为逗号 ，声明时应该指定优先级
    private expression(p: Precedence = Precedence.COMMA): Expr {
        return this.parsePrecedence(p);
    }

    private parsePrecedence(precedence: number): Expr {
        let token = this.advance();

        const prefix = this.rules[token.type][0];
        if (!prefix) {
            throw this.error(token, "Expect expression.");
        }
        let expr = prefix(token);


        while (precedence <= this.rules[this.peek().type][2]) {
            token = this.advance();
            const infix = this.rules[token.type][1];
            if (!infix) {
                throw this.error(token, "Expect expression..");
            }
            expr = infix(expr, token);
        }
        return expr;
    }


    private call(callee: Expr, paren: Token): Expr {
        const args: Expr[] = [];
        if (!this.check(TokenType.RightParen)) {
            do {
                args.push(this.expression(Precedence.ASSIGNMENT));
            } while (this.match(TokenType.Comma));
        }
        this.consume(TokenType.RightParen, "Expect ')' after arguments.");
        return new CallExpr(callee, paren, args);
    }

    private binary(left: Expr, operator: Token): Expr {
        const precedence = this.rules[operator.type][2]
        const assignOperators = [TokenType.Equal, TokenType.PlusEqual, TokenType.MinusEqual, TokenType.StarEqual, TokenType.SlashEqual, TokenType.PercentEqual, TokenType.CaretEqual, TokenType.AndEqual, TokenType.OrEqual, TokenType.GreaterGreaterEqual, TokenType.LessLessEqual]
        //赋值运算符 右结合
        if (assignOperators.includes(operator.type)) {
            //todo 赋值运算符需要检查左值是否可赋值
            if (left instanceof VariableExpr) {
                const right = this.parsePrecedence(precedence);
                return new AssignExpr(left, right, operator);
            }
            this.error(operator, "Invalid assignment target.");
        }
        const right = this.parsePrecedence(precedence + 1);
        return new BinaryExpr(left, operator, right);
    }

    private unary(operator: Token): Expr {
        const right = this.parsePrecedence(Precedence.UNARY);
        return new UnaryExpr(operator, right);
    }
    private postfix(left: Expr, operator: Token): Expr {
        //todo 赋值运算符需要检查左值是否可赋值 移到 resolve 中检查
        if (left instanceof VariableExpr) {
            return new PostfixExpr(left, operator);
        }
        this.error(operator, "Invalid assignment target.");
        return left;
    }

    private prefix(operator: Token): Expr {
        const right = this.parsePrecedence(Precedence.UNARY);
        //todo 赋值运算符需要检查左值是否可赋值
        if (right instanceof VariableExpr) {
            return new PrefixExpr(right, operator);
        }
        throw this.error(operator, "Invalid assignment target.");
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
                return new LiteralExpr(parseFloat(token.literal!.toString()));
            case TokenType.String:
                return new LiteralExpr(token.literal);
            case TokenType.This:
                return new ThisExpr(token);
            case TokenType.Identifier:
                return new VariableExpr(token);
            case TokenType.LeftParen:
                const expr = this.expression();
                this.consume(TokenType.RightParen, "Expect ')' after expression.");
                return expr;
            default:
                throw this.error(token, "Expect expression.");
        }
    }


    private type(): TypeExpr {
        if (this.match(TokenType.Identifier)) {
            const name = this.previous();
            return new PrimitiveTypeExpr(name);
        }
        throw this.error(this.peek(), "Expect type.");
    }

    // 检查是否是类型声明
    private typeDeclarCheck(): boolean {
        // 如果连续两个token都是标识符，则认为第一个是类型声明
        if (this.match(TokenType.Identifier)) {
            if (this.check(TokenType.Identifier)) {
                this.back();
                return true;
            }
            this.back();
        }
        return false;
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
        throw this.error(this.peek(), message);
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


    private back(): Token {
        if (this.current > 0) {
            this.current--;
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
            const token = this.peek();
            console.log("synchronize", token.type);
            if (token.type === TokenType.Semicolon) return;
            switch (token.type) {
                case TokenType.Class:
                case TokenType.Fun:
                case TokenType.Let:
                case TokenType.For:
                case TokenType.If:
                case TokenType.While:
                case TokenType.Return:
                    return
                default: ;
            }
            this.advance();
        }
    }

    private error(token: Token, message: string) {
        this.PARSE_ERROR = true;
        this.errorHandler(token, message);
        this.synchronize();

        return new SyntaxError(token, message);
    }

}