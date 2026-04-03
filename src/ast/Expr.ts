import { GrusType } from "./GrusTypes";
import { Parameter, Stmt } from "./Stmt";
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
    visitCommaExpr(expr: CommaExpr): R;
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
    visitArrayExpr(expr: ArrayExpr): R
    visitIndexExpr(expr: IndexExpr): R
}


//左值表达式,可以赋值包括 变量,数组,结构体,指针,函数(返回值为指针)
export abstract class LExpr extends Expr {
    arrow: boolean = false;
    isLeftValue: boolean = false;
    abstract setIsLeftValue(isLeftValue: boolean): void;
    abstract setArrow(arrow: boolean): void;
}


/**
 * 赋值表达式
 */
export class AssignExpr extends Expr {
    left: LExpr;
    value: Expr;
    equal: Token;

    constructor(left: LExpr, value: Expr, equal: Token) {
        super();
        this.left = left;
        this.value = value;
        this.equal = equal;
        this.left.setIsLeftValue(true);
    }
    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitAssignExpr(this);
    }
}
//指向表达式
export class PointExpr extends Expr {
    left: LExpr;
    value: LExpr;
    arrow: Token;
    constructor(left: LExpr, value: LExpr, arrow: Token) {
        super();
        this.left = left;
        this.value = value;
        this.arrow = arrow;
        left.setArrow(true);
        left.setIsLeftValue(true);
        value.setArrow(true);
        value.setIsLeftValue(false);
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
    target: LExpr;
    operator: Token;
    constructor(target: LExpr, operator: Token) {
        super();
        this.target = target;
        this.operator = operator;
        this.target.setArrow(true);
    }
    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitPostfixExpr(this);
    }
}

export class PrefixExpr extends Expr {
    target: LExpr;
    operator: Token;
    constructor(target: LExpr, operator: Token) {
        super();
        this.target = target;
        this.operator = operator;
        this.target.setArrow(true);
    }
    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitPrefixExpr(this);
    }
}

export class CommaExpr extends Expr {
    left: Expr;
    comma: Token;
    right: Expr;
    constructor(left: Expr, comma: Token, right: Expr) {
        super();
        this.left = left;
        this.comma = comma;
        this.right = right;
    }
    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitCommaExpr(this);
    }
}


export class CallExpr extends LExpr {
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
    setIsLeftValue(isLeftValue: boolean): void {
        this.isLeftValue = isLeftValue;
    }
    setArrow(arrow: boolean): void {
        this.arrow = arrow;
    }
}

export class GetExpr extends LExpr {
    object: LExpr;
    name: Token;
    constructor(object: LExpr, name: Token) {
        super();
        this.object = object;
        this.name = name;
    }
    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitGetExpr(this);
    }
    setIsLeftValue(isLeftValue: boolean): void {
        this.isLeftValue = isLeftValue;
        this.object.setIsLeftValue(isLeftValue);
    }
    setArrow(arrow: boolean): void {
        this.arrow = arrow;
        this.object.setArrow(arrow);
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
}



export class VariableExpr extends LExpr {
    name: Token;
    constructor(name: Token) {
        super();
        this.name = name;
    }
    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitVariableExpr(this);
    }
    setIsLeftValue(isLeftValue: boolean): void {
        this.isLeftValue = isLeftValue;
    }
    setArrow(arrow: boolean): void {
        this.arrow = arrow;
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
}

export class IndexExpr extends LExpr {
    array: LExpr;
    bracket: Token;
    index: Expr;
    constructor(array: LExpr, bracket: Token, index: Expr) {
        super();
        this.array = array;
        this.bracket = bracket;
        this.index = index;
    }
    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitIndexExpr(this);
    }
    setIsLeftValue(isLeftValue: boolean): void {
        this.isLeftValue = isLeftValue;
        this.array.setIsLeftValue(isLeftValue);
    }
    setArrow(arrow: boolean): void {
        this.arrow = arrow;
        this.array.setArrow(arrow);
    }
}
