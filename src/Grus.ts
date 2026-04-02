import { Token } from "@/ast/Token";
import { Parser } from "./parser/Parser";
import { Scanner } from "./parser/Scanner";
import { Compiler } from "./execute/compiler";
import { GLobalDeclaration, Resolver } from "./execute/Resolver";
import llvm from "@wangziwenhk/llvm-bindings";
import { Stmt } from "./ast/Stmt";


export class Grus {
    constructor(private readonly sources: {
        path: string,
        code: string,
    }[], readonly reportError: (line: number, column: number) => void) {
        this.sources = sources;
        this.reportError = reportError;
    }

    run(): string {
        const modules: llvm.Module[] = [];
        const cr: {
            resolver: Resolver,
            compiler: Compiler,
            statements: Stmt[],
            path: string,
        }[] = [];
        for (const source of this.sources) {

            const scanner = new Scanner(this.scnnerErrorHandler.bind(this));
            const parser = new Parser(this.parserErrorHandler.bind(this));
            const tokens = scanner.scanTokens(source.code);
            const statements = parser.parse(tokens);
            if (!statements) {
                throw new Error('解析失败');
            }
            const compiler = new Compiler(this.compilerErrorHandler.bind(this));
            const resolver = new Resolver(this.resolverErrorHandler.bind(this), source.path, compiler);
            cr.push({
                resolver,
                compiler,
                statements,
                path: source.path,
            });
        }
        for (const c of cr) {
            c.resolver.resolveProgram(c.statements);
        }   
        for (const c of cr) {
            c.resolver.resolveProgram(c.statements,1);
        }

        for (const c of cr) {
            console.log("-------->c.IdentifierType",c.path, c.compiler.IdentifierType);
            const module = c.compiler.compileProgram(c.statements);
            modules.push(module);
        }
        let destModule = modules[0];
        console.log(destModule.print());
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