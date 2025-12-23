import { AssignExpr, BinaryExpr, CallExpr, ConditionalExpr, Expr, ExprVisitor, GetExpr, GroupingExpr, LiteralExpr, LogicalExpr, PostfixExpr, SetExpr, ThisExpr, UnaryExpr, VariableExpr } from "@/ast/Expr";
import { PrimitiveType, TypesVisitor } from "@/ast/GrusType";
import { BlockStmt, BreakStmt, ClassStmt, ContinueStmt, ExpressionStmt, ForStmt, FunctionStmt, IfStmt, ReturnStmt, StmtVisitor, VarStmt, WhileStmt } from "@/ast/Stmt";
import { Stmt } from "@/ast/Stmt";
import { CompilerErrorHandler } from "@/parser/ErrorHandler";

type RegValue = string;
type CodeSegment = string;
export class Compiler implements ExprVisitor<RegValue>, StmtVisitor<CodeSegment>, TypesVisitor<CodeSegment> {
    scopes: Map<string, string>[] = []; // sourceName -> compiledName
    constructor(private readonly error: CompilerErrorHandler) {
        this.error = error;
    }

    compileProgram(nodes: Stmt[]): void {
        this.beginScope();
        let code = "";
        for (const stmt of nodes) {
            code += this.compileStmt(stmt);
        }
        this.endScope();
        console.log(code);
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
    visitVarStmt(stmt: VarStmt): string {
        const varName = stmt.var.name.lexeme;
        const type = stmt.type.accept(this);

        let c_varName = `%${varName}`;
        let code = "";
        if (this.scopes.length > 1) {
            const scope = this.scopes[this.scopes.length - 1];
            scope.set(varName, c_varName);
            // code = `${c_varName} = global ${type} ${stmt.initializer?.accept(this)};\n`;
        } else {
            c_varName = `@.${varName}`;
            const scope = this.scopes[this.scopes.length - 1];
            scope.set(varName, c_varName);
            code = `${c_varName} = global ${type} ${stmt.initializer?.accept(this)};\n`;
        }

        return code;
    }
    visitFunctionStmt(stmt: FunctionStmt): string {
        const fn_name = stmt.name.lexeme;
        const fn_type = stmt.returnType.accept(this);
        const fn_body = stmt.body.map(stmt => stmt.accept(this)).join("\n");
        const code = `define ${fn_type} @${fn_name}() {
        entry:
        ${fn_body}
        ret ${fn_type} 0
       }`;
        return code;
    }
    visitExpressionStmt(stmt: ExpressionStmt): string {
        return stmt.expression.accept(this);
    }
    visitIfStmt(stmt: IfStmt): string {
        throw new Error("Method not implemented.");
    }
    visitWhileStmt(stmt: WhileStmt): string {
        throw new Error("Method not implemented.");
    }
    visitForStmt(stmt: ForStmt): string {
        throw new Error("Method not implemented.");
    }
    visitBreakStmt(stmt: BreakStmt): string {
        throw new Error("Method not implemented.");
    }
    visitContinueStmt(stmt: ContinueStmt): string {
        throw new Error("Method not implemented.");
    }
    visitReturnStmt(stmt: ReturnStmt): string {
        throw new Error("Method not implemented.");
    }
    visitClassStmt(stmt: ClassStmt): string {
        throw new Error("Method not implemented.");
    }


    // Expr

    visitAssignExpr(expr: AssignExpr): RegValue {
        const type = expr.var_.type.accept(this);

        const c_varName = this.findCompiledVarName(expr.var_.name.lexeme);
        const value = expr.value.accept(this);
        return `store ${type} ${value}, ${type}* ${c_varName}`;
    }
    visitConditionalExpr(expr: ConditionalExpr): RegValue {
        return `${expr.condition.accept(this)} ? ${expr.trueExpr.accept(this)} : ${expr.falseExpr.accept(this)}`;
    }
    visitLogicalExpr(expr: LogicalExpr): RegValue {
        return `${expr.left.accept(this)} ${expr.operator.lexeme} ${expr.right.accept(this)}`;
    }
    visitBinaryExpr(expr: BinaryExpr): RegValue {
        throw new Error("Method not implemented.");
    }
    visitUnaryExpr(expr: UnaryExpr): RegValue {
        throw new Error("Method not implemented.");
    }
    visitLiteralExpr(expr: LiteralExpr): RegValue {
        return expr.value?.toString() ?? "";
    }
    visitPostfixExpr(expr: PostfixExpr): RegValue {
        throw new Error("Method not implemented.");
    }
    visitCallExpr(expr: CallExpr): RegValue {
        throw new Error("Method not implemented.");
    }
    visitSetExpr(expr: SetExpr): RegValue {
        throw new Error("Method not implemented.");
    }
    visitGetExpr(expr: GetExpr): RegValue {
        throw new Error("Method not implemented.");
    }
    visitThisExpr(expr: ThisExpr): RegValue {
        throw new Error("Method not implemented.");
    }
    visitGroupingExpr(expr: GroupingExpr): RegValue {
        throw new Error("Method not implemented.");
    }
    visitVariableExpr(expr: VariableExpr): RegValue {
        throw new Error("Method not implemented.");
    }


    visitPrimitiveType(expr: PrimitiveType): string {
        return expr.name;
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
        return sourceName;
    }
}