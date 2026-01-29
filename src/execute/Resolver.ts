import { AssignExpr, BinaryExpr, CallExpr, ConditionalExpr, Expr, ExprVisitor, GetExpr, LiteralExpr, LogicalExpr, PostfixExpr, PrefixExpr, SetExpr, ThisExpr, UnaryExpr, VariableExpr } from "@/ast/Expr";
import { FunctionTypeExpr, PrimitiveTypeExpr, TempOmittedTypeExpr, TypesExprVisitor } from "@/ast/TypeExpr";
import { BlockStmt, BreakStmt, ClassStmt, ContinueStmt, DoWhileStmt, ExpressionStmt, ForStmt, Function_, FunctionStmt, GotoStmt, IfStmt, LabelStmt, LoopStmt, Parameter, ReturnStmt, Stmt, StmtVisitor, Symbol_, Variable, VarStmt, WhileStmt } from "@/ast/Stmt";
import { Token } from "@/ast/Token";
import { ParserErrorHandler } from "@/parser/ErrorHandler";
import { TokenType } from "@/ast/TokenType";
import { GType, Primitive, SimpleType, FunctionType, TempOmittedType } from "./GTypes";


class FunEnv {
    returnType: GType;
    rightReturned: boolean;
    labels: string[]
    gotoLabels: Token[];
    loopDepth: number;
    ifStack: ('if' | 'else')[];
    private shallowIfReturned: boolean;
    constructor(returnType: GType) {
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

class Member {
    identifier: Symbol_;
    type: GType;
    defined: boolean;
    constructor(identifier: Symbol_, type: GType, defined: boolean) {
        this.identifier = identifier;
        this.type = type;
        this.defined = defined;
    }
}


type ClassType = "NONE" | "CLASS";
export class Resolver implements ExprVisitor<GType>, StmtVisitor<void>, TypesExprVisitor<GType> {

    //循环深度，用于判断break和continue是否合法
    private scopes: Map<string, Member>[] = [];
    private funEnvs: FunEnv[] = [];
    private currentFun: FunEnv = this.funEnvs[this.funEnvs.length - 1];

    private errorHandler: ParserErrorHandler;
    private currentClass: ClassType = "NONE";
    constructor(errorHandler: ParserErrorHandler) {
        this.errorHandler = errorHandler;
    }

    resolveProgram(stmts: Stmt[]): void {
        try {
            this.beginScope(stmts);
            const globalScope = this.scopes[this.scopes.length - 1];
            globalScope.set("printf", new Member(new Variable(new Token(TokenType.Identifier, "printf", null, 0, 0),
                new FunctionTypeExpr(new Token(TokenType.Identifier, "printf", null, 0, 0), new PrimitiveTypeExpr(new Token(TokenType.Identifier, "i32", null, 0, 0)), []), null), new FunctionType(new SimpleType("i32"), []), true));
            for (const stmt of stmts) {
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
    resolveExpr(node: Expr): GType {
        return node.accept(this);
    }

    visitVarStmt(stmt: VarStmt): void {
        for (const _var of stmt.vars) {
            this.declare(_var.name, _var);
            if (_var.initializer) {
                const initType = this.resolveExpr(_var.initializer);
                if (_var.type === null) {
                    if (initType instanceof SimpleType) {
                        _var.type = new PrimitiveTypeExpr(new Token(TokenType.Identifier, initType.name, null, _var.name.line, _var.name.column));
                    }
                }
                const varType = _var.type.accept(this);
                if (!checkSameType(varType, initType)) {
                    throw this.error(_var.name, `Type mismatch: ${initType} != ${_var.type}`);
                }
            } else {
                if (!_var.type) {
                    // 如果没有类型且没有初始化器，使用默认类型 i32
                    _var.type = new PrimitiveTypeExpr(new Token(TokenType.Identifier, "i32", null, _var.name.line, _var.name.column));
                }
            }
            const varType = _var.type.accept(this);
            this.define(_var.name, varType);
        }
    }

    visitBlockStmt(stmt: BlockStmt): void {
        this.beginScope(stmt.statements);
        for (const statement of stmt.statements) {
            this.resolveStmt(statement);
        }
        this.endScope();
    }

    visitFunctionStmt(stmt: FunctionStmt): void {

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
        this.beginScope(stmt.thenBranch instanceof BlockStmt ? stmt.thenBranch.statements : [stmt.thenBranch]);
        this.currentFun.ifStack.push('if');
        const conditionType = this.resolveExpr(stmt.condition);
        if (!checkBooleanType(conditionType)) {
            throw this.error(stmt.condition, "Type mismatch: boolean type expected");
        }

        this.resolveStmt(stmt.thenBranch);
        if (stmt.elseBranch) {
            this.beginScope(stmt.elseBranch instanceof BlockStmt ? stmt.elseBranch.statements : [stmt.elseBranch]);
            this.currentFun.ifStack.push('else');
            this.resolveStmt(stmt.elseBranch);
            this.currentFun.ifStack.pop();
            this.endScope();
        }
        this.currentFun.ifStack.pop();
        this.endScope();
    }
    visitWhileStmt(stmt: WhileStmt): void {
        this.beginScope(stmt.body instanceof BlockStmt ? stmt.body.statements : [stmt.body]);
        const conditionType = this.resolveExpr(stmt.condition);
        if (!checkBooleanType(conditionType)) {
            throw this.error(stmt.condition, "Type mismatch: boolean type expected");
        }
        this.currentFun.loopDepth++;
        this.resolveStmt(stmt.body);
        this.currentFun.loopDepth--;
        this.endScope();
    }
    visitDoWhileStmt(stmt: DoWhileStmt): void {
        this.beginScope(stmt.body instanceof BlockStmt ? stmt.body.statements : [stmt.body]);
        this.currentFun.loopDepth++;
        this.resolveStmt(stmt.body);
        this.currentFun.loopDepth--;
        const conditionType = this.resolveExpr(stmt.condition);
        if (!checkBooleanType(conditionType)) {
            throw this.error(stmt.condition, "Type mismatch: boolean type expected");
        }
        this.endScope();
    }
    visitForStmt(stmt: ForStmt): void {
        this.beginScope(stmt.body instanceof BlockStmt ? stmt.body.statements : [stmt.body]);
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
        this.endScope();
    }

    visitLoopStmt(stmt: LoopStmt): void {
        this.beginScope(stmt.body instanceof BlockStmt ? stmt.body.statements : [stmt.body]);
        this.currentFun.loopDepth++;
        this.resolveStmt(stmt.body);
        this.currentFun.loopDepth--;
        this.endScope();
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
        if (this.currentFun.returnType instanceof SimpleType && this.currentFun.returnType.name === "void") {
            if (stmt.value) {
                throw this.error(stmt.keyword, `Cannot return a value from a function with no return type.`);
            }
        } else {
            if (!stmt.value) {
                throw this.error(stmt.keyword, `Function with return type must return a value.`);
            }
            const returnType = this.resolveExpr(stmt.value);
            if (!checkSameType(returnType, this.currentFun.returnType)) {
                throw this.error(stmt.keyword, `Type mismatch: ${returnType} != ${this.currentFun.returnType}`);
            }
        }
        this.currentFun.funReturn();
    }


    visitVariableExpr(expr: VariableExpr): GType {
        if (this.scopes.length > 0) {
            const scope = this.scopes[this.scopes.length - 1];
            const var_ = scope.get(expr.name.lexeme);
            if (var_) {
                if (var_.type instanceof FunctionType) {

                } else {
                    if (!var_.defined) {
                        throw this.error(expr.name, `cannot read local variable in its own initializer.`);
                    }
                }
            }
        }
        const type = this.resolveLocal(expr.name);
        return type;
    }

    visitAssignExpr(expr: AssignExpr): GType {
        const leftType = this.resolveExpr(expr.target);
        const rightType = this.resolveExpr(expr.value);
        if (!checkSameType(leftType, rightType)) {
            throw this.error(expr.equal, `Type mismatch: ${leftType} != ${rightType}`);
        }
        return leftType;
    }
    visitConditionalExpr(expr: ConditionalExpr): GType {
        throw new Error("Method not implemented.");
        this.resolveExpr(expr.condition);
        this.resolveExpr(expr.trueExpr);
        this.resolveExpr(expr.falseExpr);
    }
    visitLogicalExpr(expr: LogicalExpr): GType {
        throw new Error("Method not implemented.");
        this.resolveExpr(expr.left);
        this.resolveExpr(expr.right);
    }
    visitBinaryExpr(expr: BinaryExpr): GType {
        let leftType = this.resolveExpr(expr.left);
        const rightType = this.resolveExpr(expr.right)
        if (['<<', '>>', '|', '&', '^'].includes(expr.operator.lexeme)) {
            if (!checkIntegerType(leftType) || !checkIntegerType(rightType)) {
                throw this.error(expr.operator, `Type mismatch: ${leftType} != ${rightType}`);
            }
        } else if (['!=', '==', '>', '>=', '<', '<='].includes(expr.operator.lexeme)) {
            leftType = new SimpleType("bool");
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
    visitUnaryExpr(expr: UnaryExpr): GType {
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
    visitLiteralExpr(expr: LiteralExpr): GType {
        let literalType: GType;
        if (typeof expr.value === "string") {
            literalType = new SimpleType("string");
        } else if (typeof expr.value === "number") {
            if (!Number.isInteger(expr.value)) {
                literalType = new SimpleType("float");

            } else {
                literalType = new SimpleType("i32");
            }
        } else if (typeof expr.value === "boolean") {
            literalType = new SimpleType("bool");
        } else {
            literalType = new SimpleType("void");
        }
        return literalType;
    }
    visitPostfixExpr(expr: PostfixExpr): GType {
        const leftType = this.resolveExpr(expr.target);
        if (expr.operator.type === TokenType.PlusPlus || expr.operator.type === TokenType.MinusMinus) {
            if (!checkIntegerType(leftType)) {
                throw this.error(expr.operator, `Type mismatch: ${leftType} != integer type`);
            }
        }
        return leftType;
    }
    visitPrefixExpr(expr: PrefixExpr): GType {
        const leftType = this.resolveExpr(expr.target);
        if (expr.operator.type === TokenType.PlusPlus || expr.operator.type === TokenType.MinusMinus) {
            if (!checkIntegerType(leftType)) {
                throw this.error(expr.operator, `Type mismatch: ${leftType} != integer type`);
            }
        }
        return leftType;
    }
    visitCallExpr(expr: CallExpr): GType {
        const calleeType = this.resolveExpr(expr.callee);
        if (calleeType instanceof FunctionType) {
            for (const i in calleeType.parameters) {
                const paramType = calleeType.parameters[i]; //形参类型
                const arg = expr.arguments[i];
                if (paramType instanceof TempOmittedType) {
                    break;
                }
                if (arg) {
                    const argType = this.resolveExpr(arg);

                    if (!checkSameType(paramType, argType)) {
                        throw this.error(expr.paren, `Type mismatch: ${paramType} != ${argType}`);
                    }
                } else {
                    throw this.error(expr.paren, `Too few arguments for function call`);
                }
            }
            return calleeType.returnType;
        }
        return calleeType;
    }
    visitGetExpr(expr: GetExpr): GType {
        throw new Error("Method not implemented.");
        this.resolveExpr(expr.object);
    }
    visitSetExpr(expr: SetExpr): GType {
        throw new Error("Method not implemented.");
        this.resolveExpr(expr.object);
        this.resolveExpr(expr.value);
    }
    visitThisExpr(expr: ThisExpr): GType {
        throw new Error("Method not implemented.");
        if (this.currentClass === "NONE") {
            this.error(expr.keyword, `Cannot use 'this' outside of a class.`);
        } else {
            // this.resolveLocal(expr, expr.keyword);
        }
    }

    visitPrimitiveTypeExpr(expr: PrimitiveTypeExpr): GType {
        return new SimpleType(expr.name.lexeme as Primitive);
    }
    visitFunctionTypeExpr(expr: FunctionTypeExpr): GType {
        return new FunctionType(expr.returnType.accept(this), expr.parameters.map(param => param.accept(this)));
    }
    visitTempOmittedTypeExpr(expr: TempOmittedTypeExpr): GType {
        return new TempOmittedType();
    }


    resolveFunction(stmt: FunctionStmt): void {
        this.beginScope(stmt.body);
        this.beginFunction(stmt.fun.returnType.accept(this));
        for (const param of stmt.fun.parameters) {
            this.declare(param.name, param);
            this.define(param.name, param.type.accept(this));
        }
        for (const bodyStmt of stmt.body) {
            this.resolveStmt(bodyStmt);
        }

        this.endFunction(stmt.brace);
        this.endScope();
    }


    beginScope(stmts: Stmt[]): void {
        const scope = new Map<string, Member>()
        this.scopes.push(scope);
        for (const stmt of stmts) {
            if (stmt instanceof FunctionStmt) {
                this.declare(stmt.fun.name, stmt.fun);
                this.define(stmt.fun.name, stmt.fun.type.accept(this));
            }
        }

    }
    endScope(): void {
        this.scopes.pop();
    }

    beginFunction(returnType: GType): void {
        const env = new FunEnv(returnType);
        if (returnType instanceof SimpleType && returnType.name === "void") {
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

    declare(name: Token, dec: Symbol_): void {
        if (this.scopes.length > 0) {
            const scope = this.scopes[this.scopes.length - 1];
            if (scope.has(name.lexeme)) {
                throw this.error(name, `Variable with this name ${name.lexeme} already declared in this scope.`);
            }
            scope.set(name.lexeme, new Member(dec, dec.type?.accept(this), false));
        }
    }
    define(name: Token, type: GType): void {
        if (this.scopes.length > 0) {
            const scope = this.scopes[this.scopes.length - 1];
            const declared = scope.get(name.lexeme);
            if (declared) {
                declared.defined = true;
                declared.type = type;
            } else {
                throw this.error(name, `Variable with this name ${name.lexeme} not declared in this scope.`);
            }

        }
    }

    //本地变量
    resolveLocal(vname: Token): GType {
        const name = vname.lexeme;
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            const scope = this.scopes[i];
            const _var = scope.get(name);
            if (_var) {
                if (this.funEnvs.length > 1) {
                    _var.identifier.capture = true;
                }
                const type = _var.type;
                if (!type) {
                    throw this.error(vname, `Variable ${name} type not defined`);
                }
                return type;
            }
        }
        throw this.error(vname, `Variable ${name} not found in any scope`);
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


function checkSameType(left: GType, right: GType): boolean {
    const numberTypes = ["i8", "i16", "i32", "i64", "float", "double"];
    if (left instanceof SimpleType && right instanceof SimpleType) {
        if (left.name === "bool" && right.name === "bool") {
            return true;
        }
        if (numberTypes.includes(left.name) && numberTypes.includes(right.name)) {
            return true;
        }
        return left.name === right.name;
    }
    return false;
}

function checkBooleanType(type: GType): boolean {
    return type instanceof SimpleType && type.name === "bool";
}

function checkNumberType(type: GType): boolean {
    return checkIntegerType(type) || checkFloatType(type);
}

function checkIntegerType(type: GType): boolean {
    const integerTypes = ["i8", "i16", "i32", "i64"];
    if (type instanceof SimpleType) {
        return integerTypes.includes(type.name);
    }
    return false;
}

function checkFloatType(type: GType): boolean {
    if (type instanceof SimpleType) {
        return ["float", "double"].includes(type.name);
    }
    return false;

}