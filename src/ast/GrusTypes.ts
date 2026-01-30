


export interface GrusType {
}

// export type Primitive = 'void'| 'bool'| 'i8'| 'i16'| 'i32'| 'i64'| 'float'| 'double'| 'string';

export class SimpleType implements GrusType {
    name: string;
    constructor(name: string) {
        this.name = name;
    }
}


export class PointerType implements GrusType {
    name: GrusType;
    constructor(name: GrusType) {
        this.name = name;
    }
}
export class FunctionType implements GrusType {
    returnType: GrusType;
    paramTypes: GrusType[];
    constructor(returnType: GrusType, paramTypes: GrusType[]) {
        this.returnType = returnType;
        this.paramTypes = paramTypes;
    }
}


export class TempOmittedType implements GrusType {
    name: string;
    constructor() {
        this.name = "...";
    }
   
}

