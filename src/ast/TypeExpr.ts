import { Token } from "@/ast/Token";
import { TokenType } from "./TokenType";


export abstract class TypeExpr {
    abstract accept<R>(visitor: TypesExprVisitor<R>): R;
}

export interface TypesExprVisitor<R> {
    visitPrimitiveTypeExpr(expr: TypeExpr): R;
    visitFunctionTypeExpr(expr: FunctionTypeExpr): R;
    visitTempOmittedTypeExpr(expr: TempOmittedTypeExpr): R;
}

export class PrimitiveTypeExpr extends TypeExpr {
    name: Token;
    constructor(name: Token) {
        super();
        this.name = name;
    }
    accept<R>(visitor: TypesExprVisitor<R>): R {
        return visitor.visitPrimitiveTypeExpr(this);
    }
    toString(): string {
        return this.name.lexeme;
    }
}

export class FunctionTypeExpr extends TypeExpr {
    paren: Token;
    returnType: TypeExpr;
    parameters: TypeExpr[];
    constructor(paren: Token, returnType: TypeExpr, parameters: TypeExpr[]) {
        super();
        this.paren = paren;
        this.returnType = returnType;
        this.parameters = parameters;
    }

    accept<R>(visitor: TypesExprVisitor<R>): R {
        return visitor.visitFunctionTypeExpr(this);
    }
    toString(): string {
        return `${this.returnType} (${this.parameters.map(p => p.toString()).join(", ")})`;
    }
}

export class TempOmittedTypeExpr extends TypeExpr {
    name: Token;
    constructor() {
        super();
        this.name = new Token(TokenType.Identifier, "...", null, 0, 0);
    }
    accept<R>(visitor: TypesExprVisitor<R>): R {
        return visitor.visitTempOmittedTypeExpr(this);
    }
    toString(): string {
        return "temp omitted";
    }
}

