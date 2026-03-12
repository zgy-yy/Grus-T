


export interface GrusType {
    isConst: boolean;
}
export type literalType = 'void' | 'float' | 'double' | 'i8' | 'i16' | 'i32' | 'i64' | 'string' | 'bool' | 'null';
export class SimpleType implements GrusType {
    type: literalType;
    isConst: boolean;
    constructor(type: literalType) {
        this.type = type;
        this.isConst = false;
    }
    toString(): string {
        return this.type;
    }
}


export class PointerType implements GrusType {
    oriType: GrusType;
    isConst: boolean;
    constructor(type: GrusType) {
        this.oriType = type;
        this.isConst = false;
    }
    toString(): string {
        return "@" + this.oriType.toString();
    }
}

export class FunctionType implements GrusType {
    returnType: GrusType;
    paramTypes: GrusType[];
    isConst: boolean;
    isLocal: boolean;
    constructor(returnType: GrusType, paramTypes: GrusType[], isLocal: boolean) {
        this.returnType = returnType;
        this.paramTypes = paramTypes;
        this.isConst = false;
        this.isLocal = isLocal;
    }
    toString(): string {
        return this.returnType.toString() + " -> " + this.paramTypes.map(param => param.toString()).join(", ");
    }
}



export class TempOmittedType implements GrusType {
    name: string;
    isConst: boolean;
    constructor() {
        this.name = "...";
        this.isConst = false;
    }

}

