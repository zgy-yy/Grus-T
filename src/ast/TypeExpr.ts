import { Token } from "@/ast/Token";


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
    name: string;
    constructor(name: string) {
        super();
        this.name = name;
    }
    accept<R>(visitor: TypesVisitor<R>): R {
        return visitor.visitPrimitiveType(this);
    }
}

export class FunctionType extends TypeExpr {
    returnType: TypeExpr;
    parameters: TypeExpr[];
    constructor(returnType: TypeExpr, parameters: TypeExpr[]) {
        super();
        this.returnType = returnType;
        this.parameters = parameters;
    }

    accept<R>(visitor: TypesVisitor<R>): R {
        return visitor.visitFunctionType(this);
    }
}



export class VoidType extends TypeExpr {
    constructor() {
        super();
    }
    accept<R>(visitor: TypesVisitor<R>): R {
        return visitor.visitVoidType(this);
    }
}

export class TempOmittedType extends TypeExpr {
    constructor() {
        super();
    }
    accept<R>(visitor: TypesVisitor<R>): R {
        return visitor.visitTempOmittedType(this);
    }
}

    export function sameType(type1: TypeExpr, type2: TypeExpr): boolean {
    if (type1 instanceof PrimitiveType && type2 instanceof PrimitiveType) {
        return type1.name === type2.name;
    }
    return false;
}