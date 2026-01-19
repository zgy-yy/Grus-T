import { AssignExpr, BinaryExpr, CallExpr, ConditionalExpr, Expr, ExprVisitor, GetExpr, LiteralExpr, LogicalExpr, PostfixExpr, PrefixExpr, SetExpr, ThisExpr, UnaryExpr, VariableExpr } from "@/ast/Expr";
import { FunctionType, TypeExpr, PrimitiveType, TempOmittedType, VoidType, sameType } from "@/ast/TypeExpr";
import { BlockStmt, BreakStmt, ClassStmt, ContinueStmt, DoWhileStmt, ExpressionStmt, ForStmt, FunctionStmt, GotoStmt, IfStmt, LabelStmt, LoopStmt, ReturnStmt, Stmt, StmtVisitor, VarStmt, WhileStmt } from "@/ast/Stmt";
import { Token } from "@/ast/Token";
import { ParserErrorHandler } from "@/parser/ErrorHandler";
import { TokenType } from "@/ast/TokenType";


class FunEnv {
    returnType: TypeExpr;
    rightReturned: boolean;
    labels: string[]
    gotoLabels: Token[];
    loopDepth: number;
    ifStack: ('if' | 'else')[];
    private shallowIfReturned: boolean;
    constructor(returnType: TypeExpr) {
        this.returnType = returnType;
        this.rightReturned = false;
        this.labels = []; //函数内的标签
        this.gotoLabels = []; //函数内的goto标签
        this.loopDepth = 0; //函数内的循环深度
        this.ifStack = []; //函数内的if栈
        this.shallowIfReturned = false;
    }
    funReturn() {
        if (this.loopDepth === 0) {
            if (this.ifStack.length === 0) {
                this.rightReturned = true;
            } else {
                if (this.ifStack.length == 1 && this.ifStack[0] === 'if') {
                    this.shallowIfReturned = true;
                }
                if (this.shallowIfReturned && this.ifStack.length == 2 && this.ifStack[this.ifStack.length - 1] === 'else') {
                    this.rightReturned = true;
                }
            }
        }
    }
}

class ResolverError extends Error {
    public token: Token | Expr;
    constructor(token: Token | Expr, message: string) {
        super(message);
        this.token = token;
    }
}


type ClassType = "NONE" | "CLASS";
export class Resolver implements ExprVisitor<TypeExpr>, StmtVisitor<void> {

    //循环深度，用于判断break和continue是否合法
    private scopes: Map<string, {
        type: TypeExpr | null;
        defined: boolean;
    }>[] = [];
    private funEnvs: FunEnv[] = [];
    private currentFun: FunEnv = this.funEnvs[this.funEnvs.length - 1];

    private errorHandler: ParserErrorHandler;
    private currentClass: ClassType = "NONE";
    constructor(errorHandler: ParserErrorHandler) {
        this.errorHandler = errorHandler;
    }

    resolveProgram(nodes: Stmt[]): void {
        try {
            this.beginScope();
            const globalScope = this.scopes[this.scopes.length - 1];
            globalScope.set("printf", { type: new FunctionType(new Token(TokenType.Symbol, "printf", null, 0, 0), new PrimitiveType(new Token(TokenType.Symbol, "i32", null, 0, 0)), [new PrimitiveType(new Token(TokenType.Symbol, "i8*", null, 0, 0)), new TempOmittedType()]), defined: true });
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
        if (stmt.returnType instanceof VoidType) {
            stmt.body.push(new ReturnStmt(new Token(TokenType.Return, "return", null, 0, 0), null));
        }
        this.beginFunction(stmt.returnType);
        this.declare(stmt.name);
        this.define(stmt.name, new FunctionType(stmt.name, stmt.returnType, stmt.parameters.map(param => param.type)));
        this.resolveFunction(stmt);
        this.endFunction(stmt.brace);
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
        this.currentFun.ifStack.push('if');
        const conditionType = this.resolveExpr(stmt.condition);
        if (!checkBooleanType(conditionType)) {
            throw this.error(stmt.condition, "Type mismatch: boolean type expected");
        }
        this.resolveStmt(stmt.thenBranch);
        if (stmt.elseBranch) {
            this.currentFun.ifStack.push('else');
            this.resolveStmt(stmt.elseBranch);
            this.currentFun.ifStack.pop();
        }
        this.currentFun.ifStack.pop();
    }
    visitWhileStmt(stmt: WhileStmt): void {
        const conditionType = this.resolveExpr(stmt.condition);
        if (!checkBooleanType(conditionType)) {
            throw this.error(stmt.condition, "Type mismatch: boolean type expected");
        }
        this.currentFun.loopDepth++;
        this.resolveStmt(stmt.body);
        this.currentFun.loopDepth--;
    }
    visitDoWhileStmt(stmt: DoWhileStmt): void {
        this.currentFun.loopDepth++;
        this.resolveStmt(stmt.body);
        this.currentFun.loopDepth--;
        const conditionType = this.resolveExpr(stmt.condition);
        if (!checkBooleanType(conditionType)) {
            throw this.error(stmt.condition, "Type mismatch: boolean type expected");
        }
    }
    visitForStmt(stmt: ForStmt): void {
        if (stmt.initializer) {
            this.resolveStmt(stmt.initializer);
        }
        const conditionType = this.resolveExpr(stmt.condition);
        if (!checkBooleanType(conditionType)) {
            throw this.error(stmt.condition, "Type mismatch: boolean type expected");
        }
        if (stmt.increment) {
            this.resolveExpr(stmt.increment);
        }
        this.currentFun.loopDepth++;
        this.resolveStmt(stmt.body);
        this.currentFun.loopDepth--;
    }

    visitLoopStmt(stmt: LoopStmt): void {
        this.currentFun.loopDepth++;
        this.resolveStmt(stmt.body);
        this.currentFun.loopDepth--;
    }

    visitBreakStmt(stmt: BreakStmt): void {
        if (this.currentFun.loopDepth == 0) {
            throw this.error(stmt.keyword, `Unexpected 'break'`);
        }
    }
    visitContinueStmt(stmt: ContinueStmt): void {
        if (this.currentFun.loopDepth == 0) {
            throw this.error(stmt.keyword, `Unexpected continue statement`);
        }
    }
    visitLabelStmt(stmt: LabelStmt): void {
        const label = stmt.label.lexeme;
        const currentLabels = this.currentFun.labels;
        if (currentLabels.includes(label)) {
            throw this.error(stmt.label, `Label ${label} already defined`);
        }
        currentLabels.push(label);
        if (stmt.body) {
            this.resolveStmt(stmt.body);
        }
    }

    visitGotoStmt(stmt: GotoStmt): void {
        const label = stmt.label;
        const currentGotoLabels = this.currentFun.gotoLabels;
        currentGotoLabels.push(label);
    }
    visitReturnStmt(stmt: ReturnStmt): void {
        if (this.currentFun.returnType instanceof VoidType) {
            if (stmt.value) {
                throw this.error(stmt.keyword, `Cannot return a value from a function with no return type.`);
            }
        } else {
            if (!stmt.value) {
                throw this.error(stmt.keyword, `Function with return type must return a value.`);
            }
            const returnType = this.resolveExpr(stmt.value);
            if (!sameType(returnType, this.currentFun.returnType)) {
                throw this.error(stmt.keyword, `Type mismatch: ${returnType} != ${this.currentFun.returnType}`);
            }
        }
        this.currentFun.funReturn();
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
        const leftType = this.resolveExpr(expr.target);
        const rightType = this.resolveExpr(expr.value);
        if (!checkSameType(leftType, rightType)) {
            throw this.error(expr.equal, `Type mismatch: ${leftType} != ${rightType}`);
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
            leftType = new PrimitiveType(new Token(TokenType.Symbol, "i1", null, 0, 0));
        } else if (['&&', '||'].includes(expr.operator.lexeme)) {
            if (!checkBooleanType(leftType) || !checkBooleanType(rightType)) {
                throw this.error(expr.operator, "Type mismatch: boolean type expected");
            }
        } else if ([',', '='].includes(expr.operator.lexeme)) {
            return rightType;
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
            literalType = new PrimitiveType(new Token(TokenType.Symbol, "string", null, 0, 0));
        } else if (typeof expr.value === "number") {
            if (!Number.isInteger(expr.value)) {
                literalType = new PrimitiveType(new Token(TokenType.Symbol, "float", null, 0, 0));

            } else {
                literalType = new PrimitiveType(new Token(TokenType.Symbol, "i32", null, 0, 0));
            }
        } else if (typeof expr.value === "boolean") {
            literalType = new PrimitiveType(new Token(TokenType.Symbol, "i1", null, 0, 0));
        } else {
            literalType = new VoidType(new Token(TokenType.Symbol, "void", null, 0, 0));
        }
        return literalType;
    }
    visitPostfixExpr(expr: PostfixExpr): TypeExpr {
        const leftType = this.resolveExpr(expr.target);
        if (expr.operator.type === TokenType.PlusPlus || expr.operator.type === TokenType.MinusMinus) {
            if (!checkIntegerType(leftType)) {
                throw this.error(expr.operator, `Type mismatch: ${leftType} != integer type`);
            }
        }
        return leftType;
    }
    visitPrefixExpr(expr: PrefixExpr): TypeExpr {
        const leftType = this.resolveExpr(expr.target);
        if (expr.operator.type === TokenType.PlusPlus || expr.operator.type === TokenType.MinusMinus) {
            if (!checkIntegerType(leftType)) {
                throw this.error(expr.operator, `Type mismatch: ${leftType} != integer type`);
            }
        }
        return leftType;
    }
    visitCallExpr(expr: CallExpr): TypeExpr {
        const calleeType = this.resolveExpr(expr.callee);
        if (calleeType instanceof PrimitiveType && calleeType.name.lexeme === "printf") {
            return new PrimitiveType(new Token(TokenType.Symbol, "void", null, 0, 0));
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


    resolveFunction(stmt: FunctionStmt): void {
        this.beginScope();
        for (const param of stmt.parameters) {
            this.declare(param.name);
            this.define(param.name, param.type);
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

    beginFunction(returnType: TypeExpr): void {
        const env = new FunEnv(returnType);
        if (returnType instanceof VoidType) {
            env.rightReturned = true;
        }
        this.funEnvs.push(env);
        this.currentFun = env;
    }
    endFunction(brace: Token): void {
        if (!this.currentFun.rightReturned) {
            throw this.error(brace, `Function with return type must return a value.`);
        }
        this.funEnvs.pop();
        this.currentFun = this.funEnvs[this.funEnvs.length - 1];
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


    error(token: Token | Expr, message: string): ResolverError {
        if (token instanceof Expr) {
            console.error(token, message);
        } else {
            token = token as Token;
            this.errorHandler(token, message);

        }
        return new ResolverError(token, message);

    }
}


function checkSameType(left: TypeExpr, right: TypeExpr): boolean {
    const numberTypes = ["i8", "i16", "i32", "i64", "float", "double"];
    if (left instanceof PrimitiveType && right instanceof PrimitiveType) {
        if (left.name.lexeme === "i1" && right.name.lexeme === "i1") {
            return true;
        }
        if (numberTypes.includes(left.name.lexeme) && numberTypes.includes(right.name.lexeme)) {
            return true;
        }
        return left.name === right.name;
    }
    return false;
}

function checkBooleanType(type: TypeExpr): boolean {
    return type instanceof PrimitiveType && type.name.lexeme === "i1";
}

function checkNumberType(type: TypeExpr): boolean {
    return checkIntegerType(type) || checkFloatType(type);
}

function checkIntegerType(type: TypeExpr): boolean {
    const integerTypes = ["i8", "i16", "i32", "i64"];
    if (type instanceof PrimitiveType) {
        return integerTypes.includes(type.name.lexeme);
    }
    return false;
}

function checkFloatType(type: TypeExpr): boolean {
    if (type instanceof PrimitiveType) {
        return type.name.lexeme === "float" || type.name.lexeme === "double";
    }
    return false;

}