import { AssignExpr, BinaryExpr, CallExpr, ConditionalExpr, Expr, ExprVisitor, GetExpr, GroupingExpr, LiteralExpr, LogicalExpr, PostfixExpr, SetExpr, ThisExpr, UnaryExpr, VariableExpr } from "@/ast/Expr";
import { BlockStmt, BreakStmt, ClassStmt, ContinueStmt, ExpressionStmt, ForStmt, FunctionStmt, IfStmt, ReturnStmt, Stmt, StmtVisitor, VarStmt, WhileStmt } from "@/ast/Stmt";
import { Token } from "@/ast/Token";
import { ParserErrorHandler } from "@/parser/ErrorHandler";

type AstNode = Expr | Stmt;

type FunctionType = "FUNCTION" | "METHOD";
type ClassType = "NONE" | "CLASS";
export class Resolver implements ExprVisitor<void>, StmtVisitor<void> {

    private loopDepth: number = 0;
    private scopes: Map<string, boolean>[] = [];
    private error: ParserErrorHandler;
    private currentClass: ClassType = "NONE";
    constructor(error: ParserErrorHandler) {
        this.error = error;

    }

    resolveProgram(nodes: Stmt[]): void {
        this.beginScope();
        this.resolveAll(nodes);
        this.endScope();
    }
    resolveAll(nodes: AstNode[]): void {
        for (const node of nodes) {
            this.resolve(node);
        }
    }
    resolve(node: AstNode): void {
        node.accept(this);
    }

    visitVarStmt(stmt: VarStmt): void {
        this.declare(stmt.name);
        if (stmt.initializer) {
            this.resolve(stmt.initializer);
        }
        this.define(stmt.name);
    }

    visitBlockStmt(stmt: BlockStmt): void {
        this.beginScope();
        for (const statement of stmt.statements) {
            this.resolve(statement);
        }
        this.endScope();
    }

    visitFunctionStmt(stmt: FunctionStmt): void {
        this.declare(stmt.name);
        this.define(stmt.name);
        this.resolveFunction(stmt);
    }


    visitClassStmt(stmt: ClassStmt): void {
        const enclosingClass = this.currentClass;
        this.currentClass = "CLASS";
        this.declare(stmt.name);
        this.define(stmt.name);

        this.beginScope();
        this.scopes[this.scopes.length - 1].set("this", true);
        for (const method of stmt.methods) {
            this.resolveFunction(method);
        }
        this.endScope();
        this.currentClass = enclosingClass;
    }
    visitExpressionStmt(stmt: ExpressionStmt): void {
        this.resolve(stmt.expression);
    }
    visitIfStmt(stmt: IfStmt): void {
        this.resolve(stmt.condition);
        this.resolve(stmt.thenBranch);
        if (stmt.elseBranch) {
            this.resolve(stmt.elseBranch);
        }
    }
    visitWhileStmt(stmt: WhileStmt): void {

        this.resolve(stmt.condition);
        this.loopDepth++;
        this.resolve(stmt.body);
        this.loopDepth--;
    }
    visitForStmt(stmt: ForStmt): void {
        this.resolve(stmt.initializer);
        this.resolve(stmt.condition);
        this.resolve(stmt.increment);
        this.loopDepth++;
        this.resolve(stmt.body);
        this.loopDepth--;
    }
    visitBreakStmt(stmt: BreakStmt): void {
        if (this.loopDepth <= 0) {
            this.error(stmt.keyword, `Unexpected 'break'`);
        }
    }
    visitContinueStmt(stmt: ContinueStmt): void {
        if (this.loopDepth <= 0) {
            this.error(stmt.keyword, `Unexpected continue statement`);
        }
    }
    visitReturnStmt(stmt: ReturnStmt): void {
        if (stmt.value) {
            this.resolve(stmt.value);
        }
    }


    visitVariableExpr(expr: VariableExpr): void {
        if (this.scopes.length > 0) {
            const scope = this.scopes[this.scopes.length - 1];
            if (scope.get(expr.name.lexeme) === false) {
                this.error(expr.name, `cannot read local variable in its own initializer.`);
            }
        }
        this.resolveLocal(expr, expr.name);
    }

    visitAssignExpr(expr: AssignExpr): void {
        this.resolve(expr.value);
        this.resolveLocal(expr, expr.name);
    }
    visitConditionalExpr(expr: ConditionalExpr): void {
        this.resolve(expr.condition);
        this.resolve(expr.trueExpr);
        this.resolve(expr.falseExpr);
    }
    visitLogicalExpr(expr: LogicalExpr): void {
        this.resolve(expr.left);
        this.resolve(expr.right);
    }
    visitBinaryExpr(expr: BinaryExpr): void {
        this.resolve(expr.left);
        this.resolve(expr.right);
    }
    visitUnaryExpr(expr: UnaryExpr): void {
        this.resolve(expr.right);
    }
    visitLiteralExpr(expr: LiteralExpr): void {
        // 字面量表达式没有子表达式需要解析
    }
    visitPostfixExpr(expr: PostfixExpr): void {
        this.resolve(expr.left);
    }
    visitCallExpr(expr: CallExpr): void {
        this.resolve(expr.callee);
        this.resolveAll(expr.arguments);
    }
    visitGetExpr(expr: GetExpr): void {
        this.resolve(expr.object);
    }
    visitSetExpr(expr: SetExpr): void {
        this.resolve(expr.object);
        this.resolve(expr.value);
    }
    visitThisExpr(expr: ThisExpr): void {
        if (this.currentClass === "NONE") {
            this.error(expr.keyword, `Cannot use 'this' outside of a class.`);
        } else {
            this.resolveLocal(expr, expr.keyword);
        }
    }
    visitGroupingExpr(expr: GroupingExpr): void {
        this.resolve(expr.expression);
    }


    resolveFunction(stmt: FunctionStmt): void {
        this.beginScope();
        for (const param of stmt.parameters) {
            this.declare(param);
            this.define(param);
        }
        this.resolveAll(stmt.body);
        this.endScope();
    }


    beginScope(): void {
        this.scopes.push(new Map<string, boolean>());
    }
    endScope(): void {
        this.scopes.pop();
    }
    declare(name: Token): void {
        if (this.scopes.length > 0) {
            const scope = this.scopes[this.scopes.length - 1];
            if (scope.has(name.lexeme)) {
                this.error(name, `Variable with this name ${name.lexeme} already declared in this scope.`);
            }
            scope.set(name.lexeme, false);
        }
    }
    define(name: Token): void {
        if (this.scopes.length > 0) {
            const scope = this.scopes[this.scopes.length - 1];
            scope.set(name.lexeme, true);
        }
    }
    resolveLocal(expr: Expr, name: Token): void {
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            const scope = this.scopes[i];
            if (scope.has(name.lexeme)) {
                // distance is the number of scopes from the current scope to the global scope
                return;
            }
        }
        // not found Assume global
    }
}