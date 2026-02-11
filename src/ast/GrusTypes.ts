


export interface GrusType {
    i: number;
}
export type literalType = 'void' | 'float' | 'double' | 'i8' | 'i16' | 'i32' | 'i64' | 'string' | 'bool' | 'null';
export class SimpleType implements GrusType {
    typ: literalType;
    i: number;
    constructor(typ: literalType) {
        this.typ = typ;
        this.i = 0
    }
    toString(): string {
        return this.typ;
    }
}


export class PointerType implements GrusType {
    typ: GrusType;
    i: number;
    constructor(typ: GrusType) {
        this.typ = typ;
        this.i = 1;
    }
    toString(): string {
        return this.typ.toString();
    }
}

export class FunctionType implements GrusType {
    returnType: GrusType;
    paramTypes: GrusType[];
    i: number;
    constructor(returnType: GrusType, paramTypes: GrusType[]) {
        this.returnType = returnType;
        this.paramTypes = paramTypes;
        this.i = 2;
    }
    toString(): string {
        return this.returnType.toString() + " -> " + this.paramTypes.map(param => param.toString()).join(", ");
    }
}

export class ClosureType implements GrusType {
    i: number;
    funType: FunctionType;
    constructor(returnType: GrusType, paramTypes: GrusType[]) {
        this.funType = new FunctionType(returnType, paramTypes);
        this.i = 4;
    }
    toString(): string {
        return this.funType.toString();
    }
}


export class TempOmittedType implements GrusType {
    name: string;
    i: number;
    constructor() {
        this.name = "...";
        this.i = 3;
    }

}

