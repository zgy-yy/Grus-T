import { AssignExpr, BinaryExpr, CallExpr, ConditionalExpr, Expr, ExprVisitor, GetExpr, GroupingExpr, LiteralExpr, LogicalExpr, PostfixExpr, SetExpr, ThisExpr, UnaryExpr, VariableExpr } from "@/ast/Expr";
import { FunctionType, TypeExpr, PrimitiveType, TempOmittedType, VoidType } from "@/ast/TypeExpr";
import { BlockStmt, BreakStmt, ClassStmt, ContinueStmt, ExpressionStmt, ForStmt, FunctionStmt, IfStmt, ReturnStmt, Stmt, StmtVisitor, VarStmt, WhileStmt } from "@/ast/Stmt";
import { Token } from "@/ast/Token";
import { ParserErrorHandler } from "@/parser/ErrorHandler";
import { TokenType } from "@/ast/TokenType";


class ResolverError extends Error {
    public token: Token;
    constructor(token: Token, message: string) {
        super(message);
        this.token = token;
    }
}


type ClassType = "NONE" | "CLASS";
export class Resolver implements ExprVisitor<TypeExpr>, StmtVisitor<void> {

    private loopDepth: number = 0;
    private scopes: Map<string, {
        type: TypeExpr | null;
        defined: boolean;
    }>[] = [];
    private errorHandler: ParserErrorHandler;
    private currentClass: ClassType = "NONE";
    constructor(errorHandler: ParserErrorHandler) {
        this.errorHandler = errorHandler;
    }

    resolveProgram(nodes: Stmt[]): void {
        try {
            this.beginScope();
            const globalScope = this.scopes[this.scopes.length - 1];
            globalScope.set("printf", { type: new FunctionType(new PrimitiveType("i32"), [new PrimitiveType("i8*"), new TempOmittedType()]), defined: true });
            for (const stmt of nodes) {
                this.resolveStmt(stmt);
            }
            this.endScope();
        } catch (error) {
            throw error;
        }
    }

    resolveStmt(stmt: Stmt): void {
        stmt.accept(this);
    }
    resolveExpr(node: Expr): TypeExpr {
        return node.accept(this);
    }

    visitVarStmt(stmt: VarStmt): void {
        for (const _var of stmt.vars) {
            this.declare(_var.name);
            if (_var.initializer) {
                const initType = this.resolveExpr(_var.initializer);
                if (_var.type === null) {
                    _var.type = initType;
                }
                if (!checkSameType(initType, _var.type)) {
                    throw this.error(_var.name, `Type mismatch: ${initType} != ${_var.type}`);
                }
            } else {
                if (!_var.type) {
                    throw this.error(_var.name, `Variable type is not specified.`);
                }
            }
            this.define(_var.name, _var.type);
        }
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
        // const enclosingClass = this.currentClass;
        // this.currentClass = "CLASS";
        // this.declare(stmt.name);
        // // this.define(stmt.name, stmt.type);

        // this.beginScope();
        // this.scopes[this.scopes.length - 1].set("this", { type: new PrimitiveType("this"), defined: true });
        // for (const method of stmt.methods) {
        //     this.resolveFunction(method);
        // }
        // this.endScope();
        // this.currentClass = enclosingClass;
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
        if (stmt.initializer) {
            this.resolveStmt(stmt.initializer);
        }
        this.resolveExpr(stmt.condition);
        if (stmt.increment) {
            this.resolveExpr(stmt.increment);
        }
        this.loopDepth++;
        this.resolveStmt(stmt.body);
        this.loopDepth--;
    }
    visitBreakStmt(stmt: BreakStmt): void {
        if (this.loopDepth <= 0) {
            throw this.error(stmt.keyword, `Unexpected 'break'`);
        }
    }
    visitContinueStmt(stmt: ContinueStmt): void {
        if (this.loopDepth <= 0) {
            throw this.error(stmt.keyword, `Unexpected continue statement`);
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
                throw this.error(expr.name, `cannot read local variable in its own initializer.`);
            }
        }
        const type = this.resolveLocal(expr.name);
        return type;
    }

    visitAssignExpr(expr: AssignExpr): TypeExpr {
        const leftType = this.resolveLocal(expr.name);
        const rightType = this.resolveExpr(expr.value);
        if (!checkSameType(leftType, rightType)) {
            throw this.error(expr.name, `Type mismatch: ${leftType} != ${rightType}`);
        }
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
        let leftType = this.resolveExpr(expr.left);
        const rightType = this.resolveExpr(expr.right);
        if (['<<', '>>', '|', '&', '^'].includes(expr.operator.lexeme)) {
            if (!checkIntegerType(leftType) || !checkIntegerType(rightType)) {
                throw this.error(expr.operator, `Type mismatch: ${leftType} != ${rightType}`);
            }
        } else if (['!=', '==', '>', '>=', '<', '<='].includes(expr.operator.lexeme)) {
            leftType = new PrimitiveType("i1");
        } else {
            if (!checkSameType(leftType, rightType)) {
                throw this.error(expr.operator, `Type mismatch: ${leftType} != ${rightType}`);
            }
        }
        return leftType;
    }
    visitUnaryExpr(expr: UnaryExpr): TypeExpr {
        const type = this.resolveExpr(expr.right);
        switch (expr.operator.type) {
            case TokenType.Minus:
                if (!checkNumberType(type)) {
                    throw this.error(expr.operator, `Type mismatch: ${type} not a number type`);
                }
                break;
            case TokenType.Tilde:
                if (!checkIntegerType(type)) {
                    throw this.error(expr.operator, `Type mismatch: ${type} not an integer type`);
                }
                break;
            case TokenType.Bang:
                if (!checkBooleanType(type)) {
                    throw this.error(expr.operator, `Type mismatch: ${type} != bool`);
                }
                break;
            default:
                throw this.error(expr.operator, `Unsupported unary operator: ${expr.operator.type}`);
        }
        return type;
    }
    visitLiteralExpr(expr: LiteralExpr): TypeExpr {
        let literalType: TypeExpr;
        if (typeof expr.value === "string") {
            literalType = new PrimitiveType("string");
        } else if (typeof expr.value === "number") {
            if (!Number.isInteger(expr.value)) {
                literalType = new PrimitiveType("float");

            } else {
                literalType = new PrimitiveType("i32");
            }
        } else if (typeof expr.value === "boolean") {
            literalType = new PrimitiveType("i1");
        } else {
            literalType = new VoidType();
        }
        return literalType;
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
                throw this.error(name, `Variable with this name ${name.lexeme} already declared in this scope.`);
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

    //本地变量
    resolveLocal(vname: Token): TypeExpr {
        const name = vname.lexeme;
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            const scope = this.scopes[i];
            if (scope.has(name)) {
                const type = scope.get(name)?.type;
                if (!type) {
                    throw new Error(`Variable ${name} type not defined`);
                }
                // distance is the number of scopes from the current scope to the global scope
                return type;
            }
        }
        throw this.error(vname, `Variable ${name} not found`);
    }


    error(token: Token, message: string): ResolverError {
        this.errorHandler(token, message);
        return new ResolverError(token, message);
    }
}


function checkSameType(left: TypeExpr, right: TypeExpr): boolean {
    const numberTypes = ["i8", "i16", "i32", "i64", "float", "double"];
    if (left instanceof PrimitiveType && right instanceof PrimitiveType) {
        if (left.name === "i1" && right.name === "i1") {
            return true;
        }
        if (numberTypes.includes(left.name) && numberTypes.includes(right.name)) {
            return true;
        }
        return left.name === right.name;
    }
    return false;
}

function checkBooleanType(type: TypeExpr): boolean {
    return type instanceof PrimitiveType && type.name === "i1";
}

function checkNumberType(type: TypeExpr): boolean {
    return checkIntegerType(type) || checkFloatType(type);
}

function checkIntegerType(type: TypeExpr): boolean {
    const integerTypes = ["i8", "i16", "i32", "i64"];
    if (type instanceof PrimitiveType) {
        return integerTypes.includes(type.name);
    }
    return false;
}

function checkFloatType(type: TypeExpr): boolean {
    if (type instanceof PrimitiveType) {
        return type.name === "float" || type.name === "double";
    }
    return false;

}