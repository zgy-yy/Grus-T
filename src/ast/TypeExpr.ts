import { Token } from "@/ast/Token";


export abstract class TypeExpr {
    abstract accept<R>(visitor: TypeExprVisitor<R>): R;
}

export interface TypeExprVisitor<R> {
    visitGeneralTypeExpr(expr: GeneralTypeExpr): R;
    visitFunctionTypeExpr(expr: FunctionTypeExpr): R;
    visitPointerTypeExpr(expr: PointerTypeExpr): R;
    visitArrayTypeExpr(expr: ArrayTypeExpr): R;
}


export class GeneralTypeExpr extends TypeExpr {
    name: Token;
    isConst: boolean;
    constructor(name: Token, isConst: boolean) {
        super();
        this.name = name;
        this.isConst = isConst;
    }
    accept<R>(visitor: TypeExprVisitor<R>): R {
        return visitor.visitGeneralTypeExpr(this);
    }
}

export class FunctionTypeExpr extends TypeExpr {
    returnType: TypeExpr|null;
    paramTypes: TypeExpr[];
    constructor(returnType: TypeExpr|null, paramTypes: TypeExpr[]) {
        super();
        this.returnType = returnType;
        this.paramTypes = paramTypes;
    }
    accept<R>(visitor: TypeExprVisitor<R>): R {
        return visitor.visitFunctionTypeExpr(this);
    }
}

export class PointerTypeExpr extends TypeExpr {
    type: TypeExpr;
    constructor(type: TypeExpr) {
        super();
        this.type = type;
    }
    accept<R>(visitor: TypeExprVisitor<R>): R {
        return visitor.visitPointerTypeExpr(this);
    }
}

export class ArrayTypeExpr extends TypeExpr {
    type: TypeExpr;
    size: number;
    constructor(type: TypeExpr, size: number) {
        super();
        this.type = type;
        this.size = size;
    }
    accept<R>(visitor: TypeExprVisitor<R>): R {
        return visitor.visitArrayTypeExpr(this);
    }
}
