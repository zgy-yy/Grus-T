import { Token } from "@/ast/Token";
import { Parser } from "./parser/Parser";
import { Scanner } from "./parser/Scanner";
import { Compiler } from "./execute/compiler";
import { Resolver } from "./execute/Resolver";


export class Grus {
    constructor(private readonly source: string, readonly reportError: (line: number, column: number) => void) {
        this.source = source;
        this.reportError = reportError;
    }

    run() {
        const scanner = new Scanner(this.source, this.scnnerErrorHandler.bind(this));
        const tokens = scanner.scanTokens();
        // const parser = new Parser(tokens, this.parserErrorHandler.bind(this));
        const parser = new Parser(tokens, this.parserErrorHandler.bind(this));
        const statements = parser.parse();
        console.log(statements);
        if (!statements) {
            throw new Error('解析失败');
        }
        const resolver = new Resolver(this.resolverErrorHandler.bind(this));
        resolver.resolveProgram(statements);
        const compiler = new Compiler(this.compilerErrorHandler.bind(this));
        compiler.compileProgram(statements);
    }

    scnnerErrorHandler(line: number, column: number, message: string) {
        this.reportError(line, column);
        console.error(`scanner error [line ${line}, column ${column}] ${message}`);
    }
    parserErrorHandler(token: Token, message: string) {
        for (let i = 0; i < token.lexeme.length; i++) {
            this.reportError(token.line, token.column - i);
        }
        console.error(`parser error [${token.line}:${token.column}] ${message}`);
    }
    resolverErrorHandler(token: Token, message: string) {
        for (let i = 0; i < token.lexeme.length; i++) {
            this.reportError(token.line, token.column - i);
        }
        console.error(`resolver error [${token.line}:${token.column}] ${message}`);
    }
    compilerErrorHandler(token: Token, message: string) {
        for (let i = 0; i < token.lexeme.length; i++) {
            this.reportError(token.line, token.column - i);
        }
        console.error(`compiler error [${token.line}:${token.column}] ${message}`);
    }
}