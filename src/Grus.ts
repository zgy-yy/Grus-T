import { Token } from "@/ast/Token";
import { Parser } from "./parser/Parser";
import { Scanner } from "./parser/Scanner";
import { Compiler } from "./execute/compiler";
import { Resolver } from "./execute/Resolver";
import llvm from "@wangziwenhk/llvm-bindings";


export class Grus {
    constructor(private readonly source: string[], readonly reportError: (line: number, column: number) => void) {
        this.source = source;
        this.reportError = reportError;
    }

    run(): string {
        const modules: llvm.Module[] = [];
        for (const source of this.source) {
            const compiler = new Compiler(this.compilerErrorHandler.bind(this));
            const scanner = new Scanner(this.scnnerErrorHandler.bind(this));
            const parser = new Parser(this.parserErrorHandler.bind(this));
            const tokens = scanner.scanTokens(source);
            const statements = parser.parse(tokens);
            const resolver = new Resolver(this.resolverErrorHandler.bind(this), compiler);
            if (!statements) {
                throw new Error('解析失败');
            }
            resolver.resolveProgram(statements);
            const module = compiler.compileProgram(statements);
            modules.push(module);
        }
        let destModule = modules[0];
        for (let i = 1; i < modules.length; i++) {
            llvm.Linker.linkModules(destModule, modules[i]);
        }
        return destModule.print();
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
        console.error(`resolver error  [${token.line}:${token.column}] ${token.lexeme}, ${message}`);
    }
    compilerErrorHandler(token: Token, message: string) {
        for (let i = 0; i < token.lexeme.length; i++) {
            this.reportError(token.line, token.column - i);
        }
        console.error(`compiler error [${token.line}:${token.column}] ${message}`);
    }
}