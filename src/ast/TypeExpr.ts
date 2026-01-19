import { Token } from "@/ast/Token";
import { TokenType } from "./TokenType";


export abstract class TypeExpr {
    abstract accept<R>(visitor: TypesVisitor<R>): R;
}

export interface TypesVisitor<R> {
    visitPrimitiveType(expr: TypeExpr): R;
    visitFunctionType(expr: FunctionType): R;
    visitVoidType(expr: VoidType): R;
    visitTempOmittedType(expr: TempOmittedType): R;
}

export class PrimitiveType extends TypeExpr {
    name: Token;
    constructor(name: Token) {
        super();
        if (name.lexeme === 'bool') {
            name = new Token(TokenType.Symbol, 'i1', null, 0, 0);
        }
        this.name = name;
    }
    accept<R>(visitor: TypesVisitor<R>): R {
        return visitor.visitPrimitiveType(this);
    }
    toString(): string {
        return this.name.lexeme;
    }
}

export class FunctionType extends TypeExpr {
    paren: Token;
    returnType: TypeExpr;
    parameters: TypeExpr[];
    constructor(paren: Token, returnType: TypeExpr, parameters: TypeExpr[]) {
        super();
        this.paren = paren;
        this.returnType = returnType;
        this.parameters = parameters;
    }

    accept<R>(visitor: TypesVisitor<R>): R {
        return visitor.visitFunctionType(this);
    }
    toString(): string {
        return `${this.returnType} (${this.parameters.map(p => p.toString()).join(", ")})`;
    }
}



export class VoidType extends TypeExpr {
    name: Token;
    constructor(name: Token) {
        super();
        this.name = name;
    }
    accept<R>(visitor: TypesVisitor<R>): R {
        return visitor.visitVoidType(this);
    }
    toString(): string {
        return this.name.lexeme;
    }
}

export class TempOmittedType extends TypeExpr {
    name: Token;
    constructor() {
        super();
        this.name = new Token(TokenType.Symbol, "void", null, 0, 0);
    }
    accept<R>(visitor: TypesVisitor<R>): R {
        return visitor.visitTempOmittedType(this);
    }
    toString(): string {
        return "temp omitted";
    }
}



export function sameType(type1: TypeExpr, type2: TypeExpr): boolean {
    if (type1 instanceof PrimitiveType && type2 instanceof PrimitiveType) {
        return type1.name.lexeme === type2.name.lexeme;
    }
    if (type1 instanceof FunctionType && type2 instanceof FunctionType) {
        return sameType(type1.returnType, type2.returnType) && type1.parameters.every((param, index) => sameType(param, type2.parameters[index]));
    }
    if (type1 instanceof VoidType && type2 instanceof VoidType) {
        return true;
    }
    if (type1 instanceof TempOmittedType && type2 instanceof TempOmittedType) {
        return true;
    }
    return false;
}