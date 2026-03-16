import { GrusType, literalType } from "./GrusTypes";
import { GSymbol, Parameter, Stmt } from "./Stmt";
import { Token } from "./Token";
import { TypeExpr } from "./TypeExpr";
export abstract class Expr {
    abstract accept<R>(visitor: ExprVisitor<R>): R;
}

export interface ExprVisitor<R> {
    visitAssignExpr(expr: AssignExpr): R;
    visitPointExpr(expr: PointExpr): R;
    visitConditionalExpr(expr: ConditionalExpr): R;
    visitLogicalExpr(expr: LogicalExpr): R;
    visitBinaryExpr(expr: BinaryExpr): R;
    visitUnaryExpr(expr: UnaryExpr): R;
    visitLiteralExpr(expr: LiteralExpr): R;
    visitPostfixExpr(expr: PostfixExpr): R;
    visitPrefixExpr(expr: PrefixExpr): R;
    visitCallExpr(expr: CallExpr): R;
    visitSetExpr(expr: SetExpr): R;
    visitGetExpr(expr: GetExpr): R;
    visitThisExpr(expr: ThisExpr): R;
    visitVariableExpr(expr: VariableExpr): R;
    visitLambdaExpr(expr: LambdaExpr): R;
    visitCastExpr(expr: CastExpr): R;
    visitImplicitCastExpr(expr: ImplicitCastExpr): R;
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
}


export class SetExpr extends Expr {
    object: Expr;
    name: Token;
    value: Expr;
    constructor(object: Expr, name: Token, value: Expr) {
        super();
        this.object = object;
        this.name = name;
        this.value = value;
    }

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitSetExpr(this);
    }
}


export class ThisExpr extends Expr {
    keyword: Token;
    constructor(keyword: Token) {
        super();
        this.keyword = keyword;
    }
    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitThisExpr(this);
    }
}


/**
 * 字面量表达式
 */
export class LiteralExpr extends Expr {
    literalType: literalType;
    value: string;
    constructor(value: string) {
        super();
        this.value = value;
        switch (value) {
            case 'true':
                this.literalType = 'bool';
                break;
            case 'false':
                this.literalType = 'bool';
                break;
            case 'null':
                this.literalType = 'null';
                break;
            case 'void':
                this.literalType = 'void';
                break;
            default:
                const num = Number(value);
                if (isNaN(num)) {
                    this.literalType = 'string';
                } else if (value.includes('.')) {
                    this.literalType = 'float';
                } else {
                    this.literalType = 'i32';
                }
                break;
        }
    }
    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitLiteralExpr(this);
    }
}



export class VariableExpr extends Expr {
    name: Token;
    addr:boolean
    constructor(name: Token) {
        super();
        this.name = name;
        this.addr = false;
    }
    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitVariableExpr(this);
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
}

