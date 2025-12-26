import { GrusValue } from "./GrusValue";
import { Token } from "./Token";
export abstract class Expr  {
    abstract accept<R>(visitor: ExprVisitor<R>): R;
}

export interface ExprVisitor<R> {
    visitAssignExpr(expr: AssignExpr): R;
    visitConditionalExpr(expr: ConditionalExpr): R;
    visitLogicalExpr(expr: LogicalExpr): R;
    visitBinaryExpr(expr: BinaryExpr): R;
    visitUnaryExpr(expr: UnaryExpr): R;
    visitLiteralExpr(expr: LiteralExpr): R;
    visitPostfixExpr(expr: PostfixExpr): R;
    visitCallExpr(expr: CallExpr): R;
    visitSetExpr(expr: SetExpr): R;
    visitGetExpr(expr: GetExpr): R;
    visitThisExpr(expr: ThisExpr): R;
    visitGroupingExpr(expr: GroupingExpr): R;
    visitVariableExpr(expr: VariableExpr): R;
}



/**
 * 赋值表达式
 */
export class AssignExpr extends Expr {
    name: Token;
    value: Expr;
    constructor(name: Token, value: Expr) {
        super();
        this.name = name;
        this.value = value;
    }
    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitAssignExpr(this);
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
 * 逻辑或表达式
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
    left: Expr;
    operator: Token;
    constructor(expr: Expr, operator: Token) {
        super();
        this.left = expr;
        this.operator = operator;
    }
    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitPostfixExpr(this);
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
    value: GrusValue;
    constructor(value: GrusValue) {
        super();
        this.value = value;
    }
    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitLiteralExpr(this);
    }
}

/**
 * 分组表达式
 */
export class GroupingExpr extends Expr {
    expression: Expr;
    constructor(expression: Expr) {
        super();
        this.expression = expression;
    }

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitGroupingExpr(this);
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
}
