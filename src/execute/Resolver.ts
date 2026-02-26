import { AssignExpr, BinaryExpr, CallExpr, CastExpr, ConditionalExpr, Expr, ExprVisitor, GetExpr, LambdaExpr, LiteralExpr, LogicalExpr, PostfixExpr, PrefixExpr, SetExpr, ThisExpr, UnaryExpr, VariableExpr } from "@/ast/Expr";
import { BlockStmt, BreakStmt, ClassStmt, ContinueStmt, DoWhileStmt, ExpressionStmt, ForStmt, FunctionStmt, GotoStmt, GSymbol, IfStmt, LabelStmt, LoopStmt, ReturnStmt, Stmt, StmtVisitor, VarStmt, WhileStmt } from "@/ast/Stmt";
import { Token } from "@/ast/Token";
import { ParserErrorHandler } from "@/parser/ErrorHandler";
import { TokenType } from "@/ast/TokenType";
import { GrusType, SimpleType, FunctionType, TempOmittedType } from "../ast/GrusTypes";


class FunEnv {
    returnType: GrusType;
    rightReturned: boolean;
    labels: Map<string, boolean>;
    loopDepth: number;
    ifStack: ('if' | 'else')[];
    private shallowIfReturned: boolean;
    constructor(returnType: GrusType) {
        this.returnType = returnType;
        this.rightReturned = false;
        this.labels = new Map<string, boolean>(); //函数内的标签
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
    type: GrusType;
    capture: boolean;
    defined: boolean;
    constructor(type: GrusType, defined: boolean) {
        this.type = type;
        this.defined = defined;
        this.capture = false;
    }
}


type ClassType = "NONE" | "CLASS";
export class Resolver implements ExprVisitor<GrusType>, StmtVisitor<void> {

    //循环深度，用于判断break和continue是否合法
    private scopes: Map<string, Member>[] = [];
    private currentScope: Map<string, Member> = new Map<string, Member>();
    private funEnvs: FunEnv[] = [];
    private currentFun: FunEnv = this.funEnvs[this.funEnvs.length - 1];

    private errorHandler: ParserErrorHandler;
    private currentClass: ClassType = "NONE";
    constructor(errorHandler: ParserErrorHandler) {
        this.errorHandler = errorHandler;
    }

    resolveProgram(stmts: Stmt[]): void {
        try {
            this.beginScope();
            this.currentScope.set("printf", new Member(new FunctionType(new SimpleType("i32"), [new SimpleType("string"), new TempOmittedType()]), true));
            stmts.forEach(stmt => {
                if (stmt instanceof FunctionStmt) {
                    this.declare(stmt.name, new FunctionType(stmt.returnType, stmt.parameters.map(param => param.type)));
                    this.define(stmt.name);
                }
            });
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
    resolveExpr(node: Expr): GrusType {
        return node.accept(this);
    }

    visitVarStmt(stmt: VarStmt): void {
        for (const _var of stmt.vars) {
            this.declare(_var.name, _var.type);
            if (_var.defaultValue) {
                const initType = this.resolveExpr(_var.defaultValue);
                if (_var.type === null) {
                    _var.type = initType;
                    const mem = this.currentScope?.get(_var.name.lexeme);
                    if (mem) {
                        mem.type = initType;
                    }
                }
                if (!checkSameType(_var.type, initType)) {
                    throw this.error(_var.name, `Type mismatch:  ${_var.type} != ${initType} `);
                }
            } else {
                if (!_var.type) {
                    throw this.error(_var.name, `Variable ${_var.name.lexeme} type not defined`);
                }
            }
            this.define(_var.name);
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
        this.currentFun.ifStack.push('if');
        const conditionType = this.resolveExpr(stmt.condition);
        if (!checkBooleanType(conditionType)) {
            throw new Error("Type mismatch: boolean type expected");
            // throw this.error(stmt.condition.operator, "Type mismatch: boolean type expected");
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
        this.beginScope();
        const conditionType = this.resolveExpr(stmt.condition);
        if (!checkBooleanType(conditionType)) {
            throw new Error("Type mismatch: boolean type expected");
        }
        this.currentFun.loopDepth++;
        this.resolveStmt(stmt.body);
        this.currentFun.loopDepth--;
        this.endScope();
    }
    visitDoWhileStmt(stmt: DoWhileStmt): void {
        this.beginScope();
        this.currentFun.loopDepth++;
        this.resolveStmt(stmt.body);
        this.currentFun.loopDepth--;
        const conditionType = this.resolveExpr(stmt.condition);
        if (!checkBooleanType(conditionType)) {
            throw new Error("Type mismatch: boolean type expected");
        }
        this.endScope();
    }
    visitForStmt(stmt: ForStmt): void {
        this.beginScope();
        if (stmt.initializer) {
            this.resolveStmt(stmt.initializer);
        }
        const conditionType = this.resolveExpr(stmt.condition);
        if (!checkBooleanType(conditionType)) {
            throw new Error("Type mismatch: boolean type expected");
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
        this.beginScope();
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
        const labelName = stmt.label.lexeme;
        const labels = this.currentFun.labels;
        if (labels.has(labelName)) {
            if (labels.get(labelName)!) {
                throw this.error(stmt.label, `Label ${labelName} already defined`);
            }
        }
        labels.set(labelName, true);
        if (stmt.body) {
            this.resolveStmt(stmt.body);
        }
    }

    visitGotoStmt(stmt: GotoStmt): void {
        const targetLabel = stmt.label.lexeme;
        const labels = this.currentFun.labels;
        if (!labels.has(targetLabel)) {
            labels.set(targetLabel, false);
        }
    }
    visitReturnStmt(stmt: ReturnStmt): void {
        if (this.currentFun.returnType instanceof SimpleType && this.currentFun.returnType.typ === "void") {
            if (stmt.value) {
                throw this.error(stmt.keyword, `Cannot return a value from a function with no return type.`);
            }
        } else {
            if (!stmt.value) {
                throw this.error(stmt.keyword, `Function with return type must return a value.`);
            }
            const returnType = this.resolveExpr(stmt.value);
            if (!checkSameType(this.currentFun.returnType, returnType)) {
                throw this.error(stmt.keyword, `Type mismatch: ${returnType} != ${this.currentFun.returnType}`);
            }
        }
        this.currentFun.funReturn();
    }


    visitVariableExpr(expr: VariableExpr): GrusType {
        if (this.currentScope) {
            const var_ = this.currentScope.get(expr.name.lexeme);
            if (var_) {
                if (!var_.defined) {
                    throw this.error(expr.name, `cannot read local variable in its own initializer.`);
                }
            }
        }
        const type = this.resolveLocal(expr.name);
        return type;
    }

    visitAssignExpr(expr: AssignExpr): GrusType {
        const leftType = this.resolveExpr(expr.target);
        const rightType = this.resolveExpr(expr.value);
        if (!checkSameType(leftType, rightType)) {
            throw this.error(expr.equal, `Type mismatch: ${leftType} != ${rightType}`);
        }
        return leftType;
    }
    visitConditionalExpr(expr: ConditionalExpr): GrusType {
        throw new Error("Method not implemented.");
        this.resolveExpr(expr.condition);
        this.resolveExpr(expr.trueExpr);
        this.resolveExpr(expr.falseExpr);
    }
    visitLogicalExpr(expr: LogicalExpr): GrusType {
        throw new Error("Method not implemented.");
        this.resolveExpr(expr.left);
        this.resolveExpr(expr.right);
    }
    visitBinaryExpr(expr: BinaryExpr): GrusType {
        const leftType = this.resolveExpr(expr.left);
        const rightType = this.resolveExpr(expr.right)
        if (['<<', '>>', '|', '&', '^'].includes(expr.operator.lexeme)) {
            if (!checkIntegerType(leftType) || !checkIntegerType(rightType)) {
                throw this.error(expr.operator, `Type mismatch: ${leftType} != ${rightType}`);
            }
        } else if (['!=', '==', '>', '>=', '<', '<='].includes(expr.operator.lexeme)) {
            if (!checkSameType(leftType, rightType)) {
                throw this.error(expr.operator, `Type mismatch: ${leftType} != ${rightType}`);
            }
            return new SimpleType("bool");
        } else if (['&&', '||'].includes(expr.operator.lexeme)) {
            if (!checkBooleanType(leftType) || !checkBooleanType(rightType)) {
                throw this.error(expr.operator, "Type mismatch: boolean type expected");
            }
        } else if ([',', '='].includes(expr.operator.lexeme)) {
            return rightType;
        } else {
            if (checkNumberType(leftType) && checkNumberType(rightType)) {
                // throw this.error(expr.operator, `Type mismatch: ${leftType} != ${rightType}`);
            } else {
                throw this.error(expr.operator, `Type mismatch: ${leftType} != ${rightType}`);
            }
        }
        return leftType;
    }
    visitUnaryExpr(expr: UnaryExpr): GrusType {
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
    visitLiteralExpr(expr: LiteralExpr): GrusType {
        return new SimpleType(expr.literalType);
    }
    visitPostfixExpr(expr: PostfixExpr): GrusType {
        const leftType = this.resolveExpr(expr.target);
        if (expr.operator.type === TokenType.PlusPlus || expr.operator.type === TokenType.MinusMinus) {
            if (!checkIntegerType(leftType)) {
                throw this.error(expr.operator, `Type mismatch: ${leftType} != integer type`);
            }
        }
        return leftType;
    }
    visitPrefixExpr(expr: PrefixExpr): GrusType {
        const leftType = this.resolveExpr(expr.target);
        if (expr.operator.type === TokenType.PlusPlus || expr.operator.type === TokenType.MinusMinus) {
            if (!checkIntegerType(leftType)) {
                throw this.error(expr.operator, `Type mismatch: ${leftType} != integer type`);
            }
        }
        return leftType;
    }
    visitCallExpr(expr: CallExpr): GrusType {
        const calleeType = this.resolveExpr(expr.callee);
        if (calleeType instanceof FunctionType) {
            const lastParamType = calleeType.paramTypes[calleeType.paramTypes.length - 1];
            for (const i in expr.arguments) {
                const paramType = calleeType.paramTypes[i] ?? lastParamType;//形参类型
                const argType = this.resolveExpr(expr.arguments[i]);//实参类型
                if (paramType instanceof TempOmittedType) {
                    continue;
                }
                if (!checkSameType(paramType, argType)) {
                    throw this.error(expr.paren, `Type mismatch: ${paramType} != ${argType}`);
                }
            }
            if (lastParamType instanceof TempOmittedType) {
                return calleeType.returnType;
            }
            if (expr.arguments.length < calleeType.paramTypes.length) {
                throw this.error(expr.paren, `Too few arguments for function call`);
            }
            return calleeType.returnType;
        }
        return calleeType;
    }
    visitGetExpr(expr: GetExpr): GrusType {
        throw new Error("Method not implemented.");
        this.resolveExpr(expr.object);
    }
    visitSetExpr(expr: SetExpr): GrusType {
        throw new Error("Method not implemented.");
        this.resolveExpr(expr.object);
        this.resolveExpr(expr.value);
    }
    visitThisExpr(expr: ThisExpr): GrusType {
        throw new Error("Method not implemented.");
        if (this.currentClass === "NONE") {
            this.error(expr.keyword, `Cannot use 'this' outside of a class.`);
        } else {
            // this.resolveLocal(expr, expr.keyword);
        }
    }

    visitCastExpr(expr: CastExpr): GrusType {
        const targetType = this.resolveExpr(expr.target);
        return expr.type;
    }

    visitLambdaExpr(expr: LambdaExpr): GrusType {
        this.beginScope();
        this.beginFunction(expr.returnType);
        for (const param of expr.parameters) {
            this.declare(param.name, param.type);
            this.define(param.name);
        }
        for (const bodyStmt of expr.body) {
            this.resolveStmt(bodyStmt);
        }

        this.endFunction(expr.paren);
        this.endScope();
        const paramTypes = expr.parameters.map(param => param.type);
        return new FunctionType(expr.returnType, paramTypes);
    }


    resolveFunction(stmt: FunctionStmt): void {
        this.beginFunction(stmt.returnType);
        for (const param of stmt.parameters) {
            this.declare(param.name, param.type);
            this.define(param.name);
        }
        for (const bodyStmt of stmt.body) {
            this.resolveStmt(bodyStmt);
        }

        this.endFunction(stmt.name);

    }


    beginScope(): void {
        const scope = new Map<string, Member>()
        this.currentScope = scope;
        this.scopes.push(scope);
    }
    endScope(): void {
        this.scopes.pop();
        this.currentScope = this.scopes[this.scopes.length - 1];
    }

    beginFunction(returnType: GrusType): void {
        this.beginScope();
        const env = new FunEnv(returnType);
        if (returnType instanceof SimpleType && returnType.typ === "void") {
            env.rightReturned = true;
        }
        this.funEnvs.push(env);
        this.currentFun = env;
    }
    endFunction(mark: Token): void {
        if (!this.currentFun.rightReturned) {
            throw this.error(mark, `Function with return type must return a value.`);
        }
        this.funEnvs.pop();
        const labels = this.currentFun.labels;
        for (const label of labels.keys()) {
            if (!labels.get(label)!) {
                throw this.error(mark, `Label ${label} not defined`);
            }
        }
        this.currentFun = this.funEnvs[this.funEnvs.length - 1];
        this.endScope();
    }

    declare(name: Token, type: GrusType): void {
        if (this.currentScope) {
            if (this.currentScope.has(name.lexeme)) {
                throw this.error(name, `Variable with this name ${name.lexeme} already declared in this scope.`);
            }
            this.currentScope.set(name.lexeme, new Member(type, false));
        }
    }
    define(name: Token): void {
        if (this.currentScope) {
            const declared = this.currentScope.get(name.lexeme);
            if (declared) {
                declared.defined = true;
            } else {
                throw this.error(name, `Variable with this name ${name.lexeme} not declared in this scope.`);
            }

        }
    }

    //本地变量
    resolveLocal(vname: Token): GrusType {
        const name = vname.lexeme;
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            const scope = this.scopes[i];
            const _var = scope.get(name);
            if (_var) {
                if (this.funEnvs.length > 1) {
                    _var.capture = true;
                }
                if (!_var.type) {
                    throw this.error(vname, `Variable ${name} type not defined`);
                }
                return _var.type;
            }
        }
        throw this.error(vname, `Variable ${name} not found in any scope`);
    }


    error(token: Token, message: string): ResolverError {
        this.errorHandler(token, message);

        return new ResolverError(token, message);

    }
}


function checkSameType(left: GrusType, right: GrusType): boolean {
    if (checkNumberType(left) && checkNumberType(right)) {
        return true;
    }
    if (left instanceof SimpleType && right instanceof SimpleType) {
        return left.typ === right.typ;
    }
    if (left instanceof FunctionType && right instanceof FunctionType) {
        return checkSameType(left.returnType, right.returnType) && left.paramTypes.every((param: GrusType, index: number) => checkSameType(param, right.paramTypes[index]));
    } else {
        // throw new ResolverError(left, `Type mismatch: ${left} != ${right}`);
        return false;
    }
}

function checkBooleanType(type: GrusType): boolean {
    return type instanceof SimpleType && type.typ === "bool";
}

function checkNumberType(type: GrusType): boolean {
    return checkIntegerType(type) || checkFloatType(type);
}

function checkIntegerType(type: GrusType): boolean {
    const integerTypes = ["i8", "i16", "i32", "i64"];
    if (type instanceof SimpleType) {
        return integerTypes.includes(type.typ);
    }
    return false;
}

function checkFloatType(type: GrusType): boolean {
    if (type instanceof SimpleType) {
        return ["float", "double"].includes(type.typ);
    }
    return false;

}

function typeSize(type: GrusType): number {
    if (type instanceof SimpleType) {
        switch (type.typ) {
            case "i8":
                return 1;
            case "i16":
                return 2;
            case "i32":
                return 4;
            case "i64":
                return 8;
            case "float":
                return 4;
            case "double":
                return 8;
        }
    }
    return 0;
}