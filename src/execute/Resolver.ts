import { AddressExpr, ArrayExpr, AssignExpr, BinaryExpr, CallExpr, CastExpr, ConditionalExpr, DereferenceExpr, Expr, ExprVisitor, GetExpr, ImplicitCastExpr, LambdaExpr, LiteralExpr, LogicalExpr, PointExpr, PostfixExpr, PrefixExpr, StructExpr, ThisExpr, UnaryExpr, VariableExpr } from "@/ast/Expr";
import { BlockStmt, BreakStmt, ClassStmt, ContinueStmt, DoWhileStmt, ExpressionStmt, Field, ForStmt, FunctionStmt, GotoStmt, GSymbol, IfStmt, LabelStmt, LoopStmt, Parameter, ReturnStmt, Stmt, StmtVisitor, StructStmt, Variable, VarStmt, WhileStmt } from "@/ast/Stmt";
import { Token } from "@/ast/Token";
import { ParserErrorHandler } from "@/parser/ErrorHandler";
import { TokenType } from "@/ast/TokenType";
import { ArrayType, GrusType, SimpleType, FunctionType, TempOmittedType, PointerType, literalType, StructType } from "../ast/GrusTypes";
import { Compiler } from "./compiler";
import { ArrayTypeExpr, FunctionTypeExpr, GeneralTypeExpr, PointerTypeExpr, TypeExprVisitor } from "@/ast/TypeExpr";

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
    id: 'var' | 'param' | 'func' | 'type'
    name: string
    type: GrusType
    defined: boolean;
    constructor(id: 'var' | 'param' | 'func' | 'type', name: string, type: GrusType, defined: boolean) {
        this.id = id;
        this.type = type;
        this.name = name;
        this.defined = defined;
    }
}
export class Resolver implements ExprVisitor<GrusType>, TypeExprVisitor<GrusType>, StmtVisitor<void> {

    private compiler: Compiler | null = null;
    //循环深度，用于判断break和continue是否合法
    // private typeScopes: Map<string, GrusType>[] = [];
    private scopes: Map<string, Member>[] = [];
    private currentScope: Map<string, Member> = new Map<string, Member>();
    private funEnvs: FunEnv[] = [];
    private currentFun: FunEnv = this.funEnvs[this.funEnvs.length - 1];
    private currentLambda: {
        lambda: LambdaExpr,
        deep: number
    } | null = null;
    private errorHandler: ParserErrorHandler;
    // private currentClass: ClassType = "NONE";
    private escaped: Set<GSymbol> = new Set<GSymbol>();
    constructor(errorHandler: ParserErrorHandler, compiler?: Compiler) {
        this.errorHandler = errorHandler;
        this.compiler = compiler ?? null;

    }

    resolveProgram(stmts: Stmt[]): void {
        try {
            this.beginScope();
            this.currentScope.set("i8", new Member('type', "i8", new SimpleType("i8"), true));
            this.currentScope.set("i16", new Member('type', "i16", new SimpleType("i16"), true));
            this.currentScope.set("i32", new Member('type', "i32", new SimpleType("i32"), true));
            this.currentScope.set("i64", new Member('type', "i64", new SimpleType("i64"), true));
            this.currentScope.set("float", new Member('type', "float", new SimpleType("float"), true));
            this.currentScope.set("double", new Member('type', "double", new SimpleType("double"), true));
            this.currentScope.set("string", new Member('type', "string", new SimpleType("string"), true));
            this.currentScope.set("bool", new Member('type', "bool", new SimpleType("bool"), true));
            this.currentScope.set("null", new Member('type', "null", new SimpleType("null"), true));
            this.currentScope.set("void", new Member('type', "void", new SimpleType("void"), true));

            this.currentScope.set("printf", new Member('func', "printf", new FunctionType(new SimpleType("i32"), [new SimpleType("string"), new TempOmittedType()], false), true));
            stmts.forEach(stmt => {
                if (stmt instanceof FunctionStmt) {
                    this.declare('func', stmt.name);
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

    visitStructStmt(stmt: StructStmt): void {
        const fieldNames: Set<string> = new Set<string>();
        for (const field of stmt.fields) {
            if (fieldNames.has(field.name.lexeme)) {
                throw this.error(field.name, `Field ${field.name.lexeme} already defined`);
            }
            fieldNames.add(field.name.lexeme);
        }
        let fieldTypes: { name: string, type: GrusType, isConst: boolean }[] = [];
        fieldTypes = stmt.fields.map(field => {
            const type = field.type.accept(this);
            return { name: field.name.lexeme, type: type, isConst: false };
        }).sort((a, b) => a.name.localeCompare(b.name));
        const structType = new StructType(fieldTypes);
        this.declare('type', stmt.name, structType);
        this.define(stmt.name);
    }

    visitVarStmt(stmt: VarStmt): void {
        for (const _var of stmt.vars) {
            this.declare('var', _var.name);

            if (_var.operator.type === TokenType.Equal) {
                let initType = _var.defaultValue.accept(this)
                if ((initType instanceof PointerType)) {
                    _var.defaultValue = new DereferenceExpr(_var.name, _var.defaultValue);
                    initType = _var.defaultValue.accept(this);
                }
                if (_var.type) {
                    const varType = _var.type.accept(this)
                    if ((varType instanceof PointerType)) {
                        throw this.error(_var.operator, `Type mismatch: ${varType} != pointer type`);
                    }
                    if (!checkSameType(varType, initType)) {
                        throw this.error(_var.operator, `Type mismatch`)
                    }
                    this.define(_var.name, varType);
                } else {
                    this.define(_var.name, initType);
                }

            }
            else if (_var.operator.type === TokenType.AArrow) {
                let initType = _var.defaultValue.accept(this)
                if (!(initType instanceof PointerType)) {
                    _var.defaultValue = new AddressExpr(_var.defaultValue);
                    initType = _var.defaultValue.accept(this);
                }
                if (_var.type) {
                    let varType = _var.type.accept(this)
                    if (!(varType instanceof PointerType)) {
                        throw this.error(_var.operator, `Type mismatch: ${varType} != pointer type`);
                    }
                    if (!checkSameType(varType, initType)) {
                        throw this.error(_var.operator, `Type mismatch`)
                    }
                    this.define(_var.name, varType);
                } else {
                    this.define(_var.name, new PointerType(initType));
                }
            }
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
        const returnType = stmt?.returnType?.accept(this) ?? new SimpleType("void");
        const paramTypes = stmt.parameters.map(param => param.type.accept(this));
        const funcType = new FunctionType(returnType, paramTypes, true);
        this.define(stmt.name, funcType);
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
        const conditionType = this.resolveExpr(stmt.condition);
        if (!checkBooleanType(conditionType)) {
            throw new Error("Type mismatch: boolean type expected");
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
            throw new Error("Type mismatch: boolean type expected");
        }
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
        if (this.currentFun.returnType instanceof SimpleType && this.currentFun.returnType.type === "void") {
            if (stmt.value) {
                throw this.error(stmt.keyword, `Cannot return a value from a function with no return type.`);
            }
        } else {
            if (!stmt.value) {
                throw this.error(stmt.keyword, `Function with return type must return a value.`);
            }
            const returnType = stmt.value.accept(this)
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
        return this.resolveLocal(expr);

    }

    visitAssignExpr(expr: AssignExpr): GrusType {
        let leftType = expr.target.accept(this);
        if (leftType instanceof PointerType) {
            expr.target = new DereferenceExpr(expr.equal, expr.target);
            leftType = expr.target.accept(this);
        }
        console.log(leftType);
        const rightType = expr.value.accept(this);
        if (!checkSameType(leftType, rightType)) {
            throw this.error(expr.equal, `Type mismatch: ${leftType} != ${rightType}`);
        }
        expr.value = this.implicitTypeConversion(expr.value, leftType);

        return leftType;
    }
    visitPointExpr(expr: PointExpr): GrusType {

        if (expr.target instanceof VariableExpr) {
            const targetType = expr.target.accept(this);
            if (!(targetType instanceof PointerType)) {
                throw this.error(expr.arrow, `Type mismatch: ${targetType.toString()} != pointer type`);
            }
            let valueType = expr.value.accept(this);
            if (!(valueType instanceof PointerType)) {
                expr.value = new AddressExpr(expr.value);
                valueType = expr.value.accept(this);
            }
            if (!checkSameType(targetType.oriType, valueType)) {
                throw this.error(expr.arrow, `Type mismatch: ${targetType} != ${valueType}`);
            }
            return targetType;
        }
        throw this.error(expr.arrow, `Invalid left-hand side of arrow.`);
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
        let leftType = this.resolveExpr(expr.left);
        if (leftType instanceof PointerType) {
            expr.left = new DereferenceExpr(expr.operator, expr.left);
            leftType = expr.left.accept(this);
        }
        let rightType = this.resolveExpr(expr.right)
        if (rightType instanceof PointerType) {
            expr.right = new DereferenceExpr(expr.operator, expr.right);
            rightType = expr.right.accept(this);
        }
        if (['<<', '>>', '|', '&', '^'].includes(expr.operator.lexeme)) {
            if (!checkIntegerType(leftType) || !checkIntegerType(rightType)) {
                throw this.error(expr.operator, `Type mismatch: ${leftType} != ${rightType}`);
            }
            expr.left = this.implicitTypeConversion(expr.left, rightType);
            expr.right = this.implicitTypeConversion(expr.right, leftType);
        } else if (['!=', '==', '>', '>=', '<', '<='].includes(expr.operator.lexeme)) {
            if (!checkSameType(leftType, rightType)) {
                throw this.error(expr.operator, `Type mismatch: ${leftType} != ${rightType}`);
            }
            if (checkNumberType(leftType) && checkNumberType(rightType)) {
                expr.left = this.implicitTypeConversion(expr.left, rightType);
                expr.right = this.implicitTypeConversion(expr.right, leftType);
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
                expr.left = this.implicitTypeConversion(expr.left, rightType);
                expr.right = this.implicitTypeConversion(expr.right, leftType);
                // throw this.error(expr.operator, `Type mismatch: ${leftType} != ${rightType}`);
            } else {
                throw this.error(expr.operator, `Type mismatch: ${leftType} != ${rightType}`);
            }
        }
        return leftType;
    }
    visitUnaryExpr(expr: UnaryExpr): GrusType {
        let type = this.resolveExpr(expr.right);
        if (type instanceof PointerType) {
            expr.right = new DereferenceExpr(expr.operator, expr.right);
            type = expr.right.accept(this);
        }
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
        let leftType = expr.target.accept(this);
        if (leftType instanceof PointerType) {
            expr.target = new DereferenceExpr(expr.operator, expr.target);
            leftType = expr.target.accept(this);
        }
        if (expr.operator.type === TokenType.PlusPlus || expr.operator.type === TokenType.MinusMinus) {
            if (!checkIntegerType(leftType)) {
                throw this.error(expr.operator, `Type mismatch: ${leftType} != integer type`);
            }
        }
        return leftType;
    }
    visitPrefixExpr(expr: PrefixExpr): GrusType {
        let leftType = expr.target.accept(this);
        if (leftType instanceof PointerType) {
            expr.target = new DereferenceExpr(expr.operator, expr.target);
            leftType = expr.target.accept(this);
        }
        if (expr.operator.type === TokenType.PlusPlus || expr.operator.type === TokenType.MinusMinus) {
            if (!checkIntegerType(leftType)) {
                throw this.error(expr.operator, `Type mismatch: ${leftType} != integer type`);
            }
        }
        return leftType;
    }
    visitCallExpr(expr: CallExpr): GrusType {
        let calleeType = expr.callee.accept(this);
        if (calleeType instanceof PointerType) {
            expr.callee = new DereferenceExpr(expr.paren, expr.callee);
            calleeType = expr.callee.accept(this);
        }
        if (calleeType instanceof FunctionType) {
            let retType = calleeType.returnType;
            const lastParamType = calleeType.paramTypes[calleeType.paramTypes.length - 1];
            for (const i in expr.arguments) {
                const paramType = calleeType.paramTypes[i] ?? lastParamType;//形参类型
                let argType = expr.arguments[i].accept(this);//实参类型
                if (paramType instanceof TempOmittedType) {
                    if (argType instanceof PointerType) {
                        expr.arguments[i] = new DereferenceExpr(expr.paren, expr.arguments[i]);
                        argType = expr.arguments[i].accept(this);
                    }
                    continue;
                }
                if (paramType instanceof PointerType) {
                    if (!(argType instanceof PointerType)) {
                        expr.arguments[i] = new AddressExpr(expr.arguments[i]);
                        argType = expr.arguments[i].accept(this);
                    }
                } else {
                    if ((argType instanceof PointerType)) {
                        expr.arguments[i] = new DereferenceExpr(expr.paren, expr.arguments[i]);
                        argType = expr.arguments[i].accept(this);
                    }
                }
                if (!checkSameType(paramType, argType)) {
                    throw this.error(expr.paren, `Type mismatch: ${paramType} != ${argType}`);
                }
            }
            if (lastParamType instanceof TempOmittedType) {
                return retType;
            }
            if (expr.arguments.length < calleeType.paramTypes.length) {
                throw this.error(expr.paren, `Too few arguments for function call`);
            }
            return retType;
        }
        return calleeType;
    }
    visitGetExpr(expr: GetExpr): GrusType {
        let objectType = expr.object.accept(this);
        if (objectType instanceof PointerType) {
            expr.object = new DereferenceExpr(expr.name, expr.object);
            objectType = expr.object.accept(this);
        }
        if (objectType instanceof StructType) {
            const field = objectType.fields.find(field => field.name === expr.name.lexeme);
            if (field) {
                return field.type;
            }
        }

        throw this.error(expr.name, `Field ${expr.name.lexeme} not found in struct ${objectType.toString()}`);
    }

    visitThisExpr(expr: ThisExpr): GrusType {
        throw new Error("Method not implemented.");
    }

    visitCastExpr(expr: CastExpr): GrusType {
        let sourceType = expr.source.accept(this);
        if (sourceType instanceof PointerType) {
            expr.source = new DereferenceExpr(expr.paren, expr.source);
            sourceType = expr.source.accept(this);
        }
        let targetType = expr.targetType.accept(this);
        this.compiler?.resolveIdentifier(expr.paren, targetType);
        return targetType;
    }
    //隐式类型转换
    visitImplicitCastExpr(expr: ImplicitCastExpr): GrusType {
        return expr.targetType;
    }
    visitDereferenceExpr(expr: DereferenceExpr): GrusType {
        const targetType = expr.target.accept(this);
        if (!(targetType instanceof PointerType)) {
            throw this.error(expr.name, `Type mismatch: ${targetType} != pointer type`);
        }
        return targetType.oriType;
    }
    visitAddressExpr(expr: AddressExpr): GrusType {
        return new PointerType(expr.target.accept(this));
    }



    visitStructExpr(expr: StructExpr): GrusType {
        const fieldTypes = expr.fields.map(field => {
            return {
                name: field.name.lexeme,
                type: field.value.accept(this),
                isConst: false
            }
        });
        return new StructType(fieldTypes);
    }

    visitArrayExpr(expr: ArrayExpr): GrusType {
        throw new Error("Method not implemented.");
    }

    visitLambdaExpr(expr: LambdaExpr): GrusType {
        this.currentLambda = {
            lambda: expr,
            deep: this.scopes.length
        };
        const returnType = expr.returnType.accept(this);
        this.beginFunction(returnType);
        for (const param of expr.parameters) {
            const paramType = param.type.accept(this);
            this.declare('param', param.name, paramType);
            this.define(param.name);
        }
        for (const bodyStmt of expr.body) {
            this.resolveStmt(bodyStmt);
        }
        this.endFunction(expr.paren);
        const paramTypes = expr.parameters.map(param => param.type.accept(this));
        this.currentLambda = null;
        this.compiler?.resolveIdentifier(expr.paren, new FunctionType(returnType, paramTypes, false));
        return new FunctionType(returnType, paramTypes, false);
    }

    visitGeneralTypeExpr(expr: GeneralTypeExpr): GrusType {
        return this.findIdentifier(expr.name).type;
    }
    visitFunctionTypeExpr(expr: FunctionTypeExpr): GrusType {
        let retType: GrusType = new SimpleType("void");
        if (expr.returnType) {
            retType = expr.returnType.accept(this);
        }
        const paramTypes = expr.paramTypes.map(param => param.accept(this));
        return new FunctionType(retType, paramTypes, false);
    }
    visitPointerTypeExpr(expr: PointerTypeExpr): GrusType {
        return new PointerType(expr.type.accept(this));
    }
    visitArrayTypeExpr(expr: ArrayTypeExpr): GrusType {
        throw new Error("Method not implemented.");
    }

    resolveFunction(stmt: FunctionStmt): void {
        const returnType = stmt.returnType?.accept(this) ?? new SimpleType("void");
        this.beginFunction(returnType);
        for (const param of stmt.parameters) {
            const paramType = param.type.accept(this);
            this.declare('param', param.name, paramType);
            this.define(param.name);
        }
        for (const bodyStmt of stmt.body) {
            this.resolveStmt(bodyStmt);
        }

        this.endFunction(stmt.name);

    }


    beginScope(): void {
        const scope = new Map<string, Member>();
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
        if (returnType instanceof SimpleType && returnType.type === "void") {
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

    declare(id: 'var' | 'param' | 'func' | 'type', name: Token, type?: GrusType): void {
        if (this.currentScope) {
            if (this.currentScope.has(name.lexeme)) {
                throw this.error(name, `Variable with this name ${name.lexeme} already declared in this scope.`);
            }
            type = type ?? new SimpleType("void");
            this.currentScope.set(name.lexeme, new Member(id, name.lexeme, type, false));
        }
    }
    define(name: Token, type?: GrusType): void {
        if (this.currentScope) {
            const declared = this.currentScope.get(name.lexeme);
            if (declared) {
                declared.defined = true;
                if (type) {
                    declared.type = type;
                }
                this.compiler?.resolveIdentifier(name, declared.type);
            } else {
                throw this.error(name, `Variable with this name ${name.lexeme} not declared in this scope.`);
            }

        }
    }

    //本地变量
    resolveLocal(expr: VariableExpr): GrusType {
        const vname = expr.name;
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            const scope = this.scopes[i];
            const identifier = scope.get(vname.lexeme);
            if (identifier) {
                const distance = this.scopes.length - 1 - i;
                this.compiler?.resolve(expr, distance);
                if (this.currentLambda) {
                    if (i < this.currentLambda.deep) {
                        if (identifier.id == 'var' || identifier.id == 'param') {
                            //如果距离大于lambda的深度，则需要捕获变量
                            if (distance > this.scopes.length - 1 - this.currentLambda.deep) {
                                const name = identifier.name;
                                this.currentLambda.lambda.captured.set(name, identifier.type);
                                this.compiler?.resolve(expr, this.scopes.length - 1 - this.currentLambda.deep);
                            }
                        }
                    }
                }
                if (!identifier.type) {
                    throw this.error(vname, `Variable ${vname.lexeme} type not defined`);
                }
                return identifier.type;
            }
        }


        throw this.error(vname, `Variable ${vname.lexeme} not found in any scope`);
    }

    findIdentifier(name: Token): Member {
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            const scope = this.scopes[i];
            const identifier = scope.get(name.lexeme);
            if (identifier) {
                return identifier;
            }
        }
        throw this.error(name, `Identifier ${name.lexeme} not found in any scope`);
    }

    implicitTypeConversion(value: Expr, type: GrusType) {
        const leftType = this.resolveExpr(value);
        if (leftType instanceof SimpleType && type instanceof SimpleType) {
            if (widthOf(leftType.type) < widthOf(type.type)) {
                return new ImplicitCastExpr(value, type);
            }
        }
        return value;
    }


    error(token: Token, message: string): ResolverError {
        this.errorHandler(token, message);

        return new ResolverError(token, message);

    }
}



function widthOf(t: literalType): number {
    switch (t) {
        case "i8":
            return 8;
        case "i16":
            return 16;
        case "i32":
            return 32;
        case "i64":
            return 64;
        case "float":
            return 32 + 64;
        case "double":
            return 64 + 64;
        default:
            return 0;
    }
}

function checkSameType(left: GrusType, right: GrusType): boolean {
    if (checkNumberType(left) && checkNumberType(right)) {
        return true;
    }
    if (left instanceof SimpleType && right instanceof SimpleType) {
        return left.type === right.type;
    }
    if (left instanceof PointerType && right instanceof PointerType) {
        return checkSameType(left.oriType, right.oriType);
    }
    if (left instanceof StructType && right instanceof StructType) {
        if (left.fields.length !== right.fields.length) {
            return false;
        }
        for (let i = 0; i < left.fields.length; i++) {
            const leftField = left.fields[i];
            const rightField = right.fields[i];
            if (leftField.name !== rightField.name) {
                return false;
            }
            if (!checkSameType(leftField.type, rightField.type)) {
                return false;
            }
        }
        return true;
    }
    if (left instanceof FunctionType && right instanceof FunctionType) {
        return checkSameType(left.returnType, right.returnType) && left.paramTypes.every((param: GrusType, index: number) => checkSameType(param, right.paramTypes[index]));
    } else {
        // throw new ResolverError(left, `Type mismatch: ${left} != ${right}`);
        return false;
    }
}

function checkBooleanType(type: GrusType): boolean {
    return type instanceof SimpleType && type.type === "bool";
}

function checkNumberType(type: GrusType): boolean {
    return checkIntegerType(type) || checkFloatType(type);
}

function checkIntegerType(type: GrusType): boolean {
    const integerTypes = ["i8", "i16", "i32", "i64"];
    if (type instanceof SimpleType) {
        return integerTypes.includes(type.type);
    }
    return false;
}

function checkFloatType(type: GrusType): boolean {
    if (type instanceof SimpleType) {
        return ["float", "double"].includes(type.type);
    }
    return false;

}