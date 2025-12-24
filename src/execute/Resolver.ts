import { AssignExpr, BinaryExpr, CallExpr, ConditionalExpr, Expr, ExprVisitor, GetExpr, GroupingExpr, LiteralExpr, LogicalExpr, PostfixExpr, SetExpr, ThisExpr, UnaryExpr, VariableExpr } from "@/ast/Expr";
import { FunctionType, TypeExpr, PrimitiveType, sameType, TempOmittedType } from "@/ast/TypeExpr";
import { BlockStmt, BreakStmt, ClassStmt, ContinueStmt, ExpressionStmt, ForStmt, FunctionStmt, IfStmt, ReturnStmt, Stmt, StmtVisitor, VarStmt, WhileStmt } from "@/ast/Stmt";
import { Token } from "@/ast/Token";
import { ParserErrorHandler } from "@/parser/ErrorHandler";

type AstNode = Expr | Stmt;

type ClassType = "NONE" | "CLASS";
export class Resolver implements ExprVisitor<TypeExpr>, StmtVisitor<void> {

    private loopDepth: number = 0;
    private scopes: Map<string, {
        type: TypeExpr | null;
        defined: boolean;
    }>[] = [];
    private error: ParserErrorHandler;
    private currentClass: ClassType = "NONE";
    constructor(error: ParserErrorHandler) {
        this.error = error;
    }

    resolveProgram(nodes: Stmt[]): void {
        this.beginScope();
        const globalScope = this.scopes[this.scopes.length - 1];
        globalScope.set("printf", { type: new FunctionType(new PrimitiveType("i32"), [new PrimitiveType("i8*"), new TempOmittedType()]), defined: true });
        for (const stmt of nodes) {
            this.resolveStmt(stmt);
        }   
        this.endScope();
    }
    resolveStmt(stmt: Stmt): void {
        stmt.accept(this);
    }
    resolveExpr(node: Expr): TypeExpr {
        return node.accept(this);
    }

    visitVarStmt(stmt: VarStmt): void {
        this.declare(stmt.name);
        if (stmt.initializer) {
            const initType = this.resolveExpr(stmt.initializer);
            if (!stmt.type) {
                stmt.type = initType;
            }
            if (stmt.type && !sameType(initType, stmt.type)) {
                this.error(stmt.name, `Initializer type ${initType} does not match variable type ${stmt.type}.`);
            }
        }
        this.define(stmt.name, stmt.type);
    }

    visitBlockStmt(stmt: BlockStmt): void {
        this.beginScope();
        for (const statement of stmt.statements) {
            this.resolveStmt(statement);
        }
        this.endScope();
    }

    visitFunctionStmt(stmt: FunctionStmt): void {
        this.declare(stmt.name);
        this.define(stmt.name, stmt.returnType);
        this.resolveFunction(stmt);
    }


    visitClassStmt(stmt: ClassStmt): void {
        const enclosingClass = this.currentClass;
        this.currentClass = "CLASS";
        this.declare(stmt.name);
        // this.define(stmt.name, stmt.type);

        this.beginScope();
        this.scopes[this.scopes.length - 1].set("this", { type: new PrimitiveType("this"), defined: true });
        for (const method of stmt.methods) {
            this.resolveFunction(method);
        }
        this.endScope();
        this.currentClass = enclosingClass;
    }
    visitExpressionStmt(stmt: ExpressionStmt): void {
        this.resolveExpr(stmt.expression);
    }
    visitIfStmt(stmt: IfStmt): void {
        this.resolveExpr(stmt.condition);
        this.resolveStmt(stmt.thenBranch);
        if (stmt.elseBranch) {
            this.resolveStmt(stmt.elseBranch);
        }
    }
    visitWhileStmt(stmt: WhileStmt): void {

        this.resolveExpr(stmt.condition);
        this.loopDepth++;
        this.resolveStmt(stmt.body);
        this.loopDepth--;
    }
    visitForStmt(stmt: ForStmt): void {
        this.resolveStmt(stmt.initializer);
        this.resolveExpr(stmt.condition);
        this.resolveExpr(stmt.increment);
        this.loopDepth++;
        this.resolveStmt(stmt.body);
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
            this.resolveExpr(stmt.value);
        }
    }


    visitVariableExpr(expr: VariableExpr): TypeExpr {
        if (this.scopes.length > 0) {
            const scope = this.scopes[this.scopes.length - 1];
            if (scope.get(expr.name.lexeme)?.defined === false) {
                this.error(expr.name, `cannot read local variable in its own initializer.`);
            }
        }
        const type = this.resolveLocal(expr.name);
        expr.type = type;
        return type;
    }

    visitAssignExpr(expr: AssignExpr): TypeExpr {
        const leftType = this.resolveLocal(expr.name);
        const rightType = this.resolveExpr(expr.value);
        if (!sameType(leftType, rightType)) {
            this.error(expr.name, `Type mismatch: ${leftType} != ${rightType}`);
        }
        expr.type = leftType;
        return leftType;
    }
    visitConditionalExpr(expr: ConditionalExpr): TypeExpr {
        throw new Error("Method not implemented.");
        this.resolveExpr(expr.condition);
        this.resolveExpr(expr.trueExpr);
        this.resolveExpr(expr.falseExpr);
    }
    visitLogicalExpr(expr: LogicalExpr): TypeExpr {
        throw new Error("Method not implemented.");
        this.resolveExpr(expr.left);
        this.resolveExpr(expr.right);
    }
    visitBinaryExpr(expr: BinaryExpr): TypeExpr {
        throw new Error("Method not implemented.");
        this.resolveExpr(expr.left);
        this.resolveExpr(expr.right);
    }
    visitUnaryExpr(expr: UnaryExpr): TypeExpr {
        throw new Error("Method not implemented.");
        this.resolveExpr(expr.right);
    }
    visitLiteralExpr(expr: LiteralExpr): TypeExpr {
        if (typeof expr.value === "string") {
            expr.type = new PrimitiveType("i8*");
        } else if (typeof expr.value === "number") {
            expr.type = new PrimitiveType("i32");
            return new PrimitiveType("i32");
        } else if (typeof expr.value === "boolean") {
            expr.type = new PrimitiveType("i1");
        } else {
            expr.type = new PrimitiveType("void64");
        }
        return expr.type;
    }
    visitPostfixExpr(expr: PostfixExpr): TypeExpr {
        throw new Error("Method not implemented.");
        this.resolveExpr(expr.left);
    }
    visitCallExpr(expr: CallExpr): TypeExpr {
        const calleeType = this.resolveExpr(expr.callee);
        if (calleeType instanceof PrimitiveType && calleeType.name === "printf") {
            return new PrimitiveType("void");
        }
        for (const argument of expr.arguments) {
            this.resolveExpr(argument);
        }
        expr.type = calleeType;
        return calleeType;
    }
    visitGetExpr(expr: GetExpr): TypeExpr {
        throw new Error("Method not implemented.");
        this.resolveExpr(expr.object);
    }
    visitSetExpr(expr: SetExpr): TypeExpr {
        throw new Error("Method not implemented.");
        this.resolveExpr(expr.object);
        this.resolveExpr(expr.value);
    }
    visitThisExpr(expr: ThisExpr): TypeExpr {
        throw new Error("Method not implemented.");
        if (this.currentClass === "NONE") {
            this.error(expr.keyword, `Cannot use 'this' outside of a class.`);
        } else {
            // this.resolveLocal(expr, expr.keyword);
        }
    }
    visitGroupingExpr(expr: GroupingExpr): TypeExpr {
        throw new Error("Method not implemented.");
        this.resolveExpr(expr.expression);
    }


    resolveFunction(stmt: FunctionStmt): void {
        this.beginScope();
        for (const param of stmt.parameters) {
            // this.declare(param);
            // this.define(param);
        }
        for (const bodyStmt of stmt.body) {
            this.resolveStmt(bodyStmt);
        }
        this.endScope();
    }


    beginScope(): void {
        this.scopes.push(new Map<string, {
            type: TypeExpr;
            defined: boolean;
        }>());
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
            scope.set(name.lexeme, { type: null, defined: false });
        }
    }
    define(name: Token, type: TypeExpr): void {
        if (this.scopes.length > 0) {
            const scope = this.scopes[this.scopes.length - 1];
            scope.set(name.lexeme, { type: type, defined: true });
        }
    }

    resolveLocal(name: Token): TypeExpr {
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            const scope = this.scopes[i];
            if (scope.has(name.lexeme)) {
                const type = scope.get(name.lexeme)?.type;
                if (!type) {
                    throw new Error(`Variable ${name.lexeme} not found`);
                }
                // distance is the number of scopes from the current scope to the global scope
                return type;
            }
        }
        throw new Error(`Variable ${name.lexeme} not found`);
        // not found Assume global
    }
}