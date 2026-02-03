import { AssignExpr, BinaryExpr, CallExpr, ConditionalExpr, ExprVisitor, GetExpr, LambdaExpr, LiteralExpr, LogicalExpr, PostfixExpr, PrefixExpr, SetExpr, ThisExpr, UnaryExpr, VariableExpr } from "@/ast/Expr";
import { BlockStmt, BreakStmt, ClassStmt, ContinueStmt, DoWhileStmt, ExpressionStmt, ForStmt, FunctionStmt, GotoStmt, IfStmt, LabelStmt, LoopStmt, ReturnStmt, StmtVisitor, VarStmt, WhileStmt } from "@/ast/Stmt";
import { Stmt } from "@/ast/Stmt";
import { CompilerErrorHandler } from "@/parser/ErrorHandler";
import { Token } from "@/ast/Token";
import llvm from "llvm-bindings";
import { GrusType, SimpleType } from "@/ast/GrusTypes";

export class CompilerError extends Error {
    public token: Token;
    constructor(token: Token, message: string) {
        super(message);
        this.token = token;
    }
}


export class Compiler implements ExprVisitor<llvm.Value>, StmtVisitor<void> {

    LoopStack: {
        startLabel: string,
        endLabel: string,
    }[] = [];
    scopes: Map<string, any>[] = []; // sourceName -> compiledName
    currentScope: Map<string, any> = new Map<string, any>();
    context: llvm.LLVMContext;
    module: llvm.Module;
    builder: llvm.IRBuilder;

    constructor(private readonly errorHandler: CompilerErrorHandler) {
        this.context = new llvm.LLVMContext();
        this.module = new llvm.Module('demo_module', this.context);
        this.builder = new llvm.IRBuilder(this.context);

    }

    compileProgram(stmts: Stmt[]): string {
        this.beginScope();
        //默认声明printf
        const i32Type = llvm.Type.getInt32Ty(this.context);
        const i8PtrTy = llvm.Type.getInt8PtrTy(this.context);
        const printfType = llvm.FunctionType.get(i32Type, [i8PtrTy], true);
        const printf = llvm.Function.Create(printfType, llvm.Function.LinkageTypes.ExternalLinkage, "printf", this.module);

        this.currentScope.set("printf", printf);
        for (const stmt of stmts) {
            this.compileStmt(stmt);
        }
        const code = this.module.print();
        return code;
    }

    compileStmt(stmt: Stmt): void {
        return stmt.accept(this);
    }



    // StmtVisitor methods
    visitBlockStmt(stmt: BlockStmt): void {
        throw new Error("Method not implemented.");
    }
    visitVarStmt(stmt: VarStmt): void {
        for (const variable of stmt.vars) {
            const varType = this.llvmType(variable.type);
            const varName = variable.name.lexeme;
            const varAlloca = this.builder.CreateAlloca(varType, null, varName);
            if (variable.defaultValue) {
                const defaultValue = variable.defaultValue.accept(this);
                this.builder.CreateStore(defaultValue, varAlloca);
            }
            this.currentScope.set(varName, varAlloca);
        }
    }
    visitFunctionStmt(stmt: FunctionStmt): void {
        const retType = this.llvmType(stmt.returnType);
        const paramTypes = stmt.parameters.map(param => this.llvmType(param.type));
        const funcType = llvm.FunctionType.get(retType, paramTypes, false);
        const func = llvm.Function.Create(funcType, llvm.Function.LinkageTypes.ExternalLinkage, stmt.name.lexeme, this.module);
        const bb = llvm.BasicBlock.Create(this.context, 'entry', func);
        this.builder.SetInsertPoint(bb);
        // for (const param of stmt.parameters) {
        //     const paramValue = this.builder.CreateAlloca(this.llvmType(param.type));
        //     this.builder.CreateStore(paramValue, paramValue);
        // }
        for (const bodyStmt of stmt.body) {
            this.compileStmt(bodyStmt);
        }
    }
    visitExpressionStmt(stmt: ExpressionStmt): void {
        stmt.expression.accept(this);
    }
    visitIfStmt(stmt: IfStmt): void {
        throw new Error("Method not implemented.");
    }
    visitWhileStmt(stmt: WhileStmt): void {
        throw new Error("Method not implemented.");
    }
    visitForStmt(stmt: ForStmt): void {
        throw new Error("Method not implemented.");
    }
    visitDoWhileStmt(stmt: DoWhileStmt): void {
        throw new Error("Method not implemented.");
    }
    visitLoopStmt(stmt: LoopStmt): void {
        throw new Error("Method not implemented.");
    }
    visitBreakStmt(stmt: BreakStmt): void {
        throw new Error("Method not implemented.");
    }
    visitContinueStmt(stmt: ContinueStmt): void {
        throw new Error("Method not implemented.");
    }
    visitReturnStmt(stmt: ReturnStmt): void {
        if (stmt.value) {
            const value = stmt.value.accept(this);
            this.builder.CreateRet(value);
        } else {
            this.builder.CreateRetVoid();
        }
    }
    visitClassStmt(stmt: ClassStmt): void {
        throw new Error("Method not implemented.");
    }
    visitLabelStmt(stmt: LabelStmt): void {
        throw new Error("Method not implemented.");
    }
    visitGotoStmt(stmt: GotoStmt): void {
        throw new Error("Method not implemented.");
    }

    // ExprVisitor methods
    visitAssignExpr(expr: AssignExpr): llvm.Value {
        throw new Error("Method not implemented.");
    }
    visitConditionalExpr(expr: ConditionalExpr): llvm.Value {
        throw new Error("Method not implemented.");
    }
    visitLogicalExpr(expr: LogicalExpr): llvm.Value {
        throw new Error("Method not implemented.");
    }
    visitBinaryExpr(expr: BinaryExpr): llvm.Value {
        throw new Error("Method not implemented.");
    }
    visitUnaryExpr(expr: UnaryExpr): llvm.Value {
        throw new Error("Method not implemented.");
    }
    visitLiteralExpr(expr: LiteralExpr): llvm.Value {
        if (typeof expr.value === "number") {
            return this.builder.getInt32(expr.value);
        }
        if (typeof expr.value === "string") {
            return this.builder.CreateGlobalStringPtr(expr.value);
        }
        if (typeof expr.value === "boolean") {
            return this.builder.getInt1(expr.value);
        }
        return this.builder.getInt32(0);
    }
    visitPostfixExpr(expr: PostfixExpr): llvm.Value {
        throw new Error("Method not implemented.");
    }
    visitPrefixExpr(expr: PrefixExpr): llvm.Value {
        throw new Error("Method not implemented.");
    }
    visitCallExpr(expr: CallExpr): llvm.Value {
        const callee = expr.callee.accept(this);
        const args = expr.arguments.map(arg => arg.accept(this));
        return this.builder.CreateCall(callee as llvm.Function, args);
    }
    visitSetExpr(expr: SetExpr): llvm.Value {
        throw new Error("Method not implemented.");
    }
    visitGetExpr(expr: GetExpr): llvm.Value {
        throw new Error("Method not implemented.");
    }
    visitThisExpr(expr: ThisExpr): llvm.Value {
        throw new Error("Method not implemented.");
    }
    visitVariableExpr(expr: VariableExpr): llvm.Value {
        const variable = this.currentScope.get(expr.name.lexeme);
        if (variable instanceof llvm.AllocaInst) {
            return this.builder.CreateLoad(variable.getAllocatedType(), variable, expr.name.lexeme);
        }
        if (variable instanceof llvm.Function) {
            return variable;
        }
        throw new Error(`Variable ${expr.name.lexeme} not found`);
    }
    visitLambdaExpr(expr: LambdaExpr): llvm.Value {
        throw new Error("Method not implemented.");
    }


    //作用域
    beginScope(): void {
        this.scopes.push(new Map<string, any>());
        this.currentScope = this.scopes[this.scopes.length - 1];
    }
    endScope(): void {
        this.scopes.pop();
        this.currentScope = this.scopes[this.scopes.length - 1];
    }

    define(name: string, captured: boolean): void {

    }

    llvmType(type: GrusType): llvm.IntegerType {
        if (type instanceof SimpleType) {
            switch (type.name) {
                case 'void':
                    return llvm.Type.getVoidTy(this.context);
                case 'i8':
                    return llvm.Type.getInt8Ty(this.context);
                case 'i16':
                    return llvm.Type.getInt16Ty(this.context);
                case 'i32':
                    return llvm.Type.getInt32Ty(this.context);
                case 'i64':
                    return llvm.Type.getInt64Ty(this.context);
            }
        }

        throw new Error(`Unsupported type: ${type}`);
    }

}
