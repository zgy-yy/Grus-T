import { AssignExpr, BinaryExpr, CallExpr, ConditionalExpr, Expr, ExprVisitor, GetExpr, GroupingExpr, LiteralExpr, LogicalExpr, PostfixExpr, SetExpr, ThisExpr, UnaryExpr, VariableExpr } from "@/ast/Expr";



export class AstPrinter implements ExprVisitor<string> {

    print(expr: Expr): string {
        return expr.accept(this);
    }
    visitAssignExpr(expr: AssignExpr): string {
        return this.parenthesize("=", expr.var.name.lexeme, expr.value);
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
        return this.parenthesize(expr.left.accept(this), expr.operator.lexeme);
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



    visitLiteralExpr(expr: LiteralExpr): string {
        if (expr.value === null) return "nil";
        return expr.value.toString();
    }

    visitGroupingExpr(expr: GroupingExpr): string {
        return this.parenthesize("group", expr.expression);
    }

    visitVariableExpr(expr: VariableExpr): string {
        return expr.var_.name.lexeme;
    }

    private parenthesize(name: string, ...exprs: (Expr | string)[]): string {
        const argsString = exprs.map(
            arg => arg instanceof Expr ? arg.accept(this) : arg
        );
        return `(${name} ${argsString.join(' ')})`;
    }
}