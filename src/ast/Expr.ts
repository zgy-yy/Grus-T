import { GrusType, literalType } from "./GrusTypes";
import { GSymbol, Parameter, Stmt } from "./Stmt";
import { Token } from "./Token";
import { TypeExpr } from "./TypeExpr";
export abstract class Expr {
    canAssign: boolean = false
    lvalue: boolean = false;
    abstract accept<R>(visitor: ExprVisitor<R>): R;
    abstract setLvalue(lvalue: boolean): void
}

export interface ExprVisitor<R> {
    visitAssignExpr(expr: AssignExpr): R;
    visitPointExpr(expr: PointExpr): R;
    visitDereferenceExpr(expr: DereferenceExpr): R;
    visitAddressExpr(expr: AddressExpr): R;
    visitConditionalExpr(expr: ConditionalExpr): R;
    visitLogicalExpr(expr: LogicalExpr): R;
    visitBinaryExpr(expr: BinaryExpr): R;
    visitUnaryExpr(expr: UnaryExpr): R;
    visitLiteralExpr(expr: LiteralExpr): R;
    visitPostfixExpr(expr: PostfixExpr): R;
    visitPrefixExpr(expr: PrefixExpr): R;
    visitCallExpr(expr: CallExpr): R;
    visitGetExpr(expr: GetExpr): R;
    visitThisExpr(expr: ThisExpr): R;
    visitVariableExpr(expr: VariableExpr): R;
    visitLambdaExpr(expr: LambdaExpr): R;
    visitCastExpr(expr: CastExpr): R;
    visitImplicitCastExpr(expr: ImplicitCastExpr): R;
    visitStructExpr(expr: StructExpr): R;
    visitArrayExpr(expr: ArrayExpr): R;
}


/**
 * 赋值表达式
 */
export class AssignExpr extends Expr {
    target: Expr;
    value: Expr;
    equal: Token;

    constructor(target: Expr, value: Expr, equal: Token) {
        super();
        this.target = target;
        this.value = value;
        this.equal = equal;
    }
    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitAssignExpr(this);
    }
    setLvalue(lvalue: boolean): void {
    }
}
//指向表达式
export class PointExpr extends Expr {
    target: Expr;
    value: Expr;
    arrow: Token;
    constructor(target: Expr, value: Expr, arrow: Token) {
        super();
        this.target = target;
        this.value = value;
        this.arrow = arrow;
    }
    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitPointExpr(this);
    }
    setLvalue(lvalue: boolean): void {
    }
}


//解引用
export class DereferenceExpr extends Expr {
    canAssign: boolean = true;
    target: Expr;
    constructor(target: Expr) {
        super();
        this.target = target;
    }
    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitDereferenceExpr(this);
    }
    setLvalue(lvalue: boolean): void {
        this.lvalue = lvalue;
        this.target.setLvalue(lvalue);
        this.canAssign = lvalue;
    }
}

//取地址
export class AddressExpr extends Expr {
    target: Expr;
    constructor(target: Expr) {
        super();
        this.target = target;
        this.target.setLvalue(true);
    }
    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitAddressExpr(this);
    }
    setLvalue(lvalue: boolean): void {
    }
}


/**
 * 条件表达式
 */
export class ConditionalExpr extends Expr {
    condition: Expr;
    trueExpr: Expr;
    falseExpr: Expr;
    constructor(condition: Expr, trueExpr: Expr, falseExpr: Expr) {
        super();
        this.condition = condition;
        this.trueExpr = trueExpr;
        this.falseExpr = falseExpr;
    }
    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitConditionalExpr(this);
    }
    setLvalue(lvalue: boolean): void {
    }
}



/**
 * 逻辑表达式
 */
export class LogicalExpr extends Expr {
    left: Expr;
    operator: Token;
    right: Expr;
    constructor(left: Expr, operator: Token, right: Expr) {
        super();
        this.left = left;
        this.operator = operator;
        this.right = right;
    }
    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitLogicalExpr(this);
    }
    setLvalue(lvalue: boolean): void {
    }
}



/**
 * 二元表达式
 */
export class BinaryExpr extends Expr {
    left: Expr;
    operator: Token;
    right: Expr;
    constructor(left: Expr, operator: Token, right: Expr) {
        super();
        this.left = left;
        this.operator = operator;
        this.right = right;
    }

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitBinaryExpr(this);
    }
    setLvalue(lvalue: boolean): void {
    }
}


/**
 * 一元表达式
 */
export class UnaryExpr extends Expr {
    operator: Token;
    right: Expr;
    constructor(operator: Token, right: Expr) {
        super();
        this.operator = operator;
        this.right = right;
    }
    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitUnaryExpr(this);
    }
    setLvalue(lvalue: boolean): void {
    }
}


/**
 * 后缀表达式
 */
export class PostfixExpr extends Expr {
    target: Expr;
    operator: Token;
    constructor(target: Expr, operator: Token) {
        super();
        this.target = target;
        this.operator = operator;
    }
    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitPostfixExpr(this);
    }
    setLvalue(lvalue: boolean): void {
    }
}

export class PrefixExpr extends Expr {
    target: Expr;
    operator: Token;
    constructor(target: Expr, operator: Token) {
        super();
        this.target = target;
        this.operator = operator;
    }
    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitPrefixExpr(this);
    }
    setLvalue(lvalue: boolean): void {
    }
}


export class CallExpr extends Expr {
    callee: Expr;
    paren: Token;
    arguments: Expr[];
    constructor(callee: Expr, paren: Token, args: Expr[]) {
        super();
        this.callee = callee;
        this.paren = paren;
        this.arguments = args;
    }

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitCallExpr(this);
    }
    setLvalue(lvalue: boolean): void {
    }
}

export class GetExpr extends Expr {
    object: Expr;
    name: Token;
    constructor(object: Expr, name: Token) {
        super();
        this.object = object;
        this.name = name;
    }
    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitGetExpr(this);
    }
    setLvalue(lvalue: boolean): void {
        this.lvalue = lvalue;
        this.object.setLvalue(lvalue);
        this.canAssign = lvalue;
    }
}

export class ThisExpr extends Expr {
    canAssign: boolean = true;
    keyword: Token;
    constructor(keyword: Token) {
        super();
        this.keyword = keyword;
    }
    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitThisExpr(this);
    }
    setLvalue(lvalue: boolean): void {
    }
}


/**
 * 字面量表达式
 */
export class LiteralExpr extends Expr {
    value: string | boolean | null | number;
    constructor(value: string) {
        super();
        this.value = value;
        switch (value) {
            case 'true':
                this.value = true;
                break;
            case 'false':
                this.value = false;
                break;
            case 'null':
                this.value = null;
                break;
            default:
                const num = Number(value);
                if (isNaN(num)) {
                    this.value = value;
                } else {
                    this.value = Number(value);
                }
                break;
        }
    }
    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitLiteralExpr(this);
    }
    setLvalue(lvalue: boolean): void {
    }
}



export class VariableExpr extends Expr {
    name: Token;
    constructor(name: Token) {
        super();
        this.name = name;
    }
    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitVariableExpr(this);
    }
    setLvalue(lvalue: boolean): void {
        this.lvalue = lvalue;
        this.canAssign = lvalue;
    }
}

export class CastExpr extends Expr {
    paren: Token;
    targetType: TypeExpr;
    source: Expr;
    constructor(paren: Token, targetType: TypeExpr, source: Expr) {
        super();
        this.paren = paren;
        this.targetType = targetType;
        this.source = source;
    }
    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitCastExpr(this);
    }
    setLvalue(lvalue: boolean): void {
    }
}

export class ImplicitCastExpr extends Expr {
    source: Expr;
    targetType: GrusType;
    constructor(source: Expr, targetType: GrusType) {
        super();
        this.source = source;
        this.targetType = targetType;
    }
    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitImplicitCastExpr(this);
    }
    setLvalue(lvalue: boolean): void {
    }
}


export class LambdaExpr extends Expr {
    paren: Token;
    parameters: Parameter[];
    returnType: TypeExpr;
    body: Stmt[];
    captured: Map<string, GrusType>;
    constructor(paren: Token, parameters: Parameter[], returnType: TypeExpr, body: Stmt[]) {
        super();
        this.paren = paren;
        this.parameters = parameters;
        this.returnType = returnType;
        this.body = body;
        this.captured = new Map<string, GrusType>();
    }
    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitLambdaExpr(this);
    }
    setLvalue(lvalue: boolean): void {
    }
}

export class StructExpr extends Expr {
    brace: Token;
    fields: {
        name: Token;
        operator: Token;
        value: Expr
    }[];
    constructor(brace: Token, fields: { name: Token; operator: Token; value: Expr }[]) {
        super();
        this.brace = brace;
        this.fields = fields.sort((a, b) => a.name.lexeme.localeCompare(b.name.lexeme));
    }
    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitStructExpr(this);
    }
    setLvalue(lvalue: boolean): void {
    }
}

/** 数组字面量：[ expr, ... ]；resolvedType 由 Resolver 填充 */
export class ArrayExpr extends Expr {
    bracket: Token;
    elements: Expr[];
    constructor(bracket: Token, elements: Expr[]) {
        super();
        this.bracket = bracket;
        this.elements = elements;
    }
    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitArrayExpr(this);
    }
    setLvalue(lvalue: boolean): void {
    }
}

