import { ArrayExpr, AssignExpr, BinaryExpr, CallExpr, CastExpr, CommaExpr, ConditionalExpr, Expr, ExprVisitor, GetExpr, ImplicitCastExpr, IndexExpr, LambdaExpr, LiteralExpr, LogicalExpr, PointExpr, PostfixExpr, PrefixExpr, StructExpr, ThisExpr, UnaryExpr, VariableExpr } from "@/ast/Expr";



export class AstPrinter implements ExprVisitor<string> {

    print(expr: Expr): string {
        return expr.accept(this);
    }
    visitAssignExpr(expr: AssignExpr): string {
        return this.parenthesize("=", expr.target.accept(this), expr.value.accept(this));
    }
    visitPointExpr(expr: PointExpr): string {
        return this.parenthesize("=>", expr.target.accept(this), expr.value.accept(this));
    }
    visitConditionalExpr(expr: ConditionalExpr): string {
        return this.parenthesize("?", expr.condition.accept(this), expr.trueExpr.accept(this), expr.falseExpr.accept(this));
    }
    visitLogicalExpr(expr: LogicalExpr): string {
        return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
    }

    visitBinaryExpr(expr: BinaryExpr): string {
        return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
    }

    visitUnaryExpr(expr: UnaryExpr): string {
        return this.parenthesize(expr.operator.lexeme, expr.right);
    }

    visitPostfixExpr(expr: PostfixExpr): string {
        return this.parenthesize(expr.target.accept(this), expr.operator.lexeme);
    }
    visitPrefixExpr(expr: PrefixExpr): string {
        return this.parenthesize(expr.operator.lexeme, expr.target.accept(this));
    }
    visitCallExpr(expr: CallExpr): string {
        return this.parenthesize("call", expr.callee, ...expr.arguments);
    }
    visitGetExpr(expr: GetExpr): string {
        return this.parenthesize("get", expr.object, expr.name.lexeme);
    }
    visitThisExpr(expr: ThisExpr): string {
        return "this";
    }
    visitLambdaExpr(expr: LambdaExpr): string {
        return ""
    }
    visitCastExpr(expr: CastExpr): string {
        return this.parenthesize("cast", expr.targetType.toString(), expr.source.accept(this));
    }


    visitLiteralExpr(expr: LiteralExpr): string {
        if (expr.value === null) return "nil";
        return expr.value.toString();
    }

    visitVariableExpr(expr: VariableExpr): string {
        return expr.name.lexeme;
    }
    visitStructExpr(expr: StructExpr): string {
        const fields = expr.fields.map(f => `${f.name.lexeme}: ${f.value.accept(this)}`).join(", ");
        return `{ ${fields} }`;
    }
    visitArrayExpr(expr: ArrayExpr): string {
        const elts = expr.elements.map(e => e.accept(this)).join(", ");
        return `[ ${elts} ]`;
    }
    visitImplicitCastExpr(expr: ImplicitCastExpr): string {
        return expr.source.accept(this);
    }
    visitCommaExpr(expr: CommaExpr): string {
        return expr.left.accept(this) + ", " + expr.right.accept(this);
    }
    visitIndexExpr(expr: IndexExpr): string {
        return this.parenthesize("[", expr.array.accept(this), expr.index.accept(this));
    }

    private parenthesize(name: string, ...exprs: (Expr | string)[]): string {
        const argsString = exprs.map(
            arg => arg instanceof Expr ? arg.accept(this) : arg
        );
        return `(${name} ${argsString.join(' ')})`;
    }
}