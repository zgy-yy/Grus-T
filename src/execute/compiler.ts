import { AssignExpr, BinaryExpr, CallExpr, ConditionalExpr, Expr, ExprVisitor, GetExpr, GroupingExpr, LiteralExpr, LogicalExpr, PostfixExpr, SetExpr, ThisExpr, UnaryExpr, VariableExpr } from "@/ast/Expr";
import { FunctionType, PrimitiveType, TempOmittedType, TypesVisitor, VoidType } from "@/ast/TypeExpr";
import { BlockStmt, BreakStmt, ClassStmt, ContinueStmt, ExpressionStmt, ForStmt, FunctionStmt, IfStmt, ReturnStmt, StmtVisitor, VarStmt, WhileStmt } from "@/ast/Stmt";
import { Stmt } from "@/ast/Stmt";
import { CompilerErrorHandler } from "@/parser/ErrorHandler";

type Reg = string;
type IrSegment = string;
export class Compiler implements ExprVisitor<[IrSegment, Reg]>, StmtVisitor<IrSegment>, TypesVisitor<IrSegment> {
    static constStrI: number = 0;
    static regI: number = 0;
    scopes: Map<string, string>[] = []; // sourceName -> compiledName
    globals: string[] = ["declare i32 @printf(i8*, ...)\n"];
    code: string = "";
    constructor(private readonly error: CompilerErrorHandler) {
        this.error = error;
    }

    compileProgram(nodes: Stmt[]): string {
        this.beginScope();
        this.scopes[this.scopes.length - 1].set("printf", "@printf");
        for (const stmt of nodes) {
            this.code += this.compileStmt(stmt);
        }
        for (const global of this.globals.reverse()) {
            this.code = global + this.code;
        }
        this.endScope();
        return this.code;
    }

    compileStmt(stmt: Stmt): string {
        return stmt.accept(this);
    }
    visitBlockStmt(stmt: BlockStmt): string {
        this.beginScope();
        let code = "";
        for (const statement of stmt.statements) {
            code += statement.accept(this);
        }
        this.endScope();
        return code;
    }
    visitVarStmt(stmt: VarStmt): IrSegment {
        const varName = stmt.name.lexeme;
        const type = stmt.type.accept(this);
        let ir_code = "";
        const [code, reg] = stmt.initializer?.accept(this) ?? ["", ""];
        if (code) {
            ir_code += `${code}\n`;
        }

        let c_varName = `%${varName}`;
        if (this.scopes.length > 1) {
            const scope = this.scopes[this.scopes.length - 1];
            scope.set(varName, c_varName);
            ir_code += `${c_varName} = alloca ${type}\n`;
            if (reg) {
                ir_code += `store ${type} ${reg}, ${type}* ${c_varName}\n`;
            }
        } else {
            c_varName = `@.${varName}`;
            const scope = this.scopes[this.scopes.length - 1];
            scope.set(varName, c_varName);

            ir_code = `${c_varName} = global ${type} ${reg}\n`;
        }

        return ir_code;
    }
    visitFunctionStmt(stmt: FunctionStmt): IrSegment {
        this.beginScope();
        Compiler.regI = 0;
        const fn_name = stmt.name.lexeme;
        const fn_type = stmt.returnType.accept(this);
        const fn_body = stmt.body.map(stmt => stmt.accept(this)).join("\n");
        const code = `define ${fn_type} @${fn_name}() {
        entry:
        ${fn_body}
        ret ${fn_type} 0
       }`;
        this.endScope();
        return code;
    }
    visitExpressionStmt(stmt: ExpressionStmt): IrSegment {
        const [code, reg] = stmt.expression.accept(this);
        return code;
    }
    visitIfStmt(stmt: IfStmt): IrSegment {
        throw new Error("Method not implemented.");
    }
    visitWhileStmt(stmt: WhileStmt): IrSegment {
        throw new Error("Method not implemented.");
    }
    visitForStmt(stmt: ForStmt): IrSegment {
        throw new Error("Method not implemented.");
    }
    visitBreakStmt(stmt: BreakStmt): IrSegment {
        throw new Error("Method not implemented.");
    }
    visitContinueStmt(stmt: ContinueStmt): IrSegment {
        throw new Error("Method not implemented.");
    }
    visitReturnStmt(stmt: ReturnStmt): IrSegment {
        throw new Error("Method not implemented.");
    }
    visitClassStmt(stmt: ClassStmt): IrSegment {
        throw new Error("Method not implemented.");
    }


    // Expr

    visitAssignExpr(expr: AssignExpr): [IrSegment, Reg] {
        const type = expr.type.accept(this);

        const c_varName = this.findCompiledVarName(expr.name.lexeme);
        const [code, value] = expr.value.accept(this);
        const codeSegment = `store ${type} ${value}, ${type}* ${c_varName}`;
        return [codeSegment, value];
    }
    visitConditionalExpr(expr: ConditionalExpr): [IrSegment, Reg] {
        throw new Error("Method not implemented.");
        // return `${expr.condition.accept(this)} ? ${expr.trueExpr.accept(this)} : ${expr.falseExpr.accept(this)}`;
    }
    visitLogicalExpr(expr: LogicalExpr): [IrSegment, Reg] {
        throw new Error("Method not implemented.");
    }
    visitBinaryExpr(expr: BinaryExpr): [IrSegment, Reg] {
        throw new Error("Method not implemented.");
    }
    visitUnaryExpr(expr: UnaryExpr): [IrSegment, Reg] {
        throw new Error("Method not implemented.");
    }
    visitLiteralExpr(expr: LiteralExpr): [IrSegment, Reg] {
        const globalReg = `@.constant_${Compiler.constStrI++}`
        if (typeof expr.value === "string") {
            // private unnamed_addr constant [15 x i8] c"Hello, World!\0A\00", align 1
            const g_ir = `${globalReg} = private unnamed_addr constant [${expr.value.length + 2} x i8] c"${expr.value}\\0A\\00" align 1\n`;
            this.globals.push(g_ir);
            return ["", globalReg];
        }
        return ["", expr.value?.toString() ?? ""]
    }
    visitPostfixExpr(expr: PostfixExpr): [IrSegment, Reg] {
        throw new Error("Method not implemented.");
    }
    visitCallExpr(expr: CallExpr): [IrSegment, Reg] {
        const reg = `%call_reg_${Compiler.regI++}`;
        const calleeType = expr.callee.type.accept(this);
        const args = expr.arguments.map(argument => argument.accept(this));
        const argsRegs: Reg[] = [];
        let ir_code = "";
        args.forEach(arg => {
            if (arg[0]) {
                ir_code += arg[0];
            }
            if (arg[1]) {
                argsRegs.push(arg[1]);
            }
        });

        const [code, callee] = expr.callee.accept(this);
        if (code) {
            ir_code += code;
        }
        const paramTypes = expr.arguments.map(argument => argument.type.accept(this));

        ir_code += `call ${calleeType} ${callee}(${argsRegs.map((arg, index) => `${paramTypes[index]} ${arg}`).join(", ")})\n`;
        return [ir_code, reg];
    }
    visitSetExpr(expr: SetExpr): [IrSegment, Reg] {
        throw new Error("Method not implemented.");
    }
    visitGetExpr(expr: GetExpr): [IrSegment, Reg] {
        throw new Error("Method not implemented.");
    }
    visitThisExpr(expr: ThisExpr): [IrSegment, Reg] {
        throw new Error("Method not implemented.");
    }
    visitGroupingExpr(expr: GroupingExpr): [IrSegment, Reg] {
        throw new Error("Method not implemented.");
    }
    visitVariableExpr(expr: VariableExpr): [IrSegment, Reg] {
        const reg = `%val_reg_${Compiler.regI++}`;
        const type = expr.type.accept(this);
        const c_varName = this.findCompiledVarName(expr.name.lexeme);
        if (expr.type instanceof FunctionType) {
            const ir_code = `${reg} = bitcast ${type}* ${c_varName} to ${type}*\n`;
            return [ir_code, reg];
        }
        const ir_code = `${reg} = load ${type} , ${type}* ${c_varName}\n`;
        return [ir_code, reg];
    }


    visitPrimitiveType(expr: PrimitiveType): string {
        if (expr.name === "string") {
            return "i8*";
        }
        return expr.name;
    }
    visitFunctionType(expr: FunctionType): string {
        return expr.returnType.accept(this) + "(" + expr.parameters.map(parameter => parameter.accept(this)).join(", ") + ")";
    }

    visitVoidType(expr: VoidType): string {
        return "void";
    }

    visitTempOmittedType(expr: TempOmittedType): string {
        return "...";
    }


    beginScope(): void {
        this.scopes.push(new Map<string, string>());
    }
    endScope(): void {
        this.scopes.pop();
    }

    findCompiledVarName(sourceName: string): string {
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            const scope = this.scopes[i];
            const compiledName = scope.get(sourceName);
            if (compiledName) {
                return compiledName;
            }
        }
        throw new Error(`Variable ${sourceName} not found`);
    }
}