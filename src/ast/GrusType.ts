import { Token } from "@/ast/Token";


export abstract class GrusType {
    abstract accept<R>(visitor: TypesVisitor<R>): R;
}

export interface TypesVisitor<R> {
    visitPrimitiveType(expr: GrusType): R;
}

export class PrimitiveType extends GrusType {
    name: Token;
    constructor(name: Token) {
        super();
        this.name = name;
    }
    accept<R>(visitor: TypesVisitor<R>): R {
        return visitor.visitPrimitiveType(this);
    }
}
