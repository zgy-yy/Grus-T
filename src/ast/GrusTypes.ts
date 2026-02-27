


export interface GrusType {
    i: number;
}
export type literalType = 'void' | 'float' | 'double' | 'i8' | 'i16' | 'i32' | 'i64' | 'string' | 'bool' | 'null';
export class SimpleType implements GrusType {
    type: literalType;
    i: number;
    constructor(type: literalType) {
        this.type = type;
        this.i = 0
    }
    toString(): string {
        return this.type;
    }
}


export class PointerType implements GrusType {
    type: GrusType;
    i: number;
    constructor(type: GrusType) {
        this.type = type;
        this.i = 1;
    }
    toString(): string {
        return this.type.toString();
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



export class TempOmittedType implements GrusType {
    name: string;
    i: number;
    constructor() {
        this.name = "...";
        this.i = 3;
    }

}

