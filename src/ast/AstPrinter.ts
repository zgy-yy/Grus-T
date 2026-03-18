import { ArrayExpr, AssignExpr, BinaryExpr, CallExpr, CastExpr, Expr, ExprVisitor, GetExpr, ImplicitCastExpr, LambdaExpr, LiteralExpr, LogicalExpr, PointExpr, PostfixExpr, PrefixExpr, SetExpr, StructExpr, ThisExpr, UnaryExpr, VariableExpr } from "@/ast/Expr";



export class AstPrinter implements ExprVisitor<string> {

    print(expr: Expr): string {
        return expr.accept(this);
    }
    visitAssignExpr(expr: AssignExpr): string {
        return this.parenthesize("=", expr.name.lexeme, expr.value.accept(this));
    }
    visitPointExpr(expr: PointExpr): string {
        return this.parenthesize("=>", expr.name.lexeme, expr.value.accept(this));
    }
    visitConditionalExpr(expr: ConditionalExpr): string {
        return this.parenthesize("?", expr.condition, expr.trueExpr, expr.falseExpr);
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
        return this.parenthesize(expr.name.lexeme, expr.operator.lexeme);
    }
    visitPrefixExpr(expr: PrefixExpr): string {
        return this.parenthesize(expr.operator.lexeme, expr.name.lexeme);
    }
    visitCallExpr(expr: CallExpr): string {
        return this.parenthesize("call", expr.callee, ...expr.arguments);
    }
    visitSetExpr(expr: SetExpr): string {
        return this.parenthesize("set", expr.object, expr.name.lexeme, expr.value);
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
        return this.parenthesize("cast", expr.type.toString(), expr.source.accept(this));
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
        return `${expr.typeName.lexeme} { ${fields} }`;
    }
    visitArrayExpr(expr: ArrayExpr): string {
        const elts = expr.elements.map(e => e.accept(this)).join(", ");
        return `[ ${elts} ]`;
    }
    visitImplicitCastExpr(expr: ImplicitCastExpr): string {
        return expr.source.accept(this);
    }

    private parenthesize(name: string, ...exprs: (Expr | string)[]): string {
        const argsString = exprs.map(
            arg => arg instanceof Expr ? arg.accept(this) : arg
        );
        return `(${name} ${argsString.join(' ')})`;
    }
}