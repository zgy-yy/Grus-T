import { Token } from "@/ast/Token";


export abstract class GrusType {
    abstract accept<R>(visitor: TypesVisitor<R>): R;
}

export interface TypesVisitor<R> {
    visitPrimitiveType(expr: GrusType): R;
}

export class PrimitiveType extends GrusType {
    name: string;
    constructor(name: string) {
        super();
        this.name = name;
    }
    accept<R>(visitor: TypesVisitor<R>): R {
        return visitor.visitPrimitiveType(this);
    }
}


export function sameType(type1: GrusType, type2: GrusType): boolean {
    if (type1 instanceof PrimitiveType && type2 instanceof PrimitiveType) {
        return type1.name === type2.name;
    }
    return false;
}