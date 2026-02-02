


export interface GrusType {
    i: number;
}

// export type Primitive = 'void'| 'bool'| 'i8'| 'i16'| 'i32'| 'i64'| 'float'| 'double'| 'string';

export class SimpleType implements GrusType {
    name: string;
    i: number;
    constructor(name: string) {
        this.name = name;
        this.i = 0
    }
}


export class PointerType implements GrusType {
    name: GrusType;
    i: number;
    constructor(name: GrusType) {
        this.name = name;
        this.i = 1;
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
}

export class ClosureType implements GrusType {
    i: number;
    funType: FunctionType;
    constructor(returnType: GrusType, paramTypes: GrusType[]) {
        this.funType = new FunctionType(returnType, paramTypes);
        this.i = 4;
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

