


export interface GType {
}

export type Primitive = 'void'| 'bool'| 'i8'| 'i16'| 'i32'| 'i64'| 'float'| 'double'| 'string';

export class SimpleType implements GType {
    name: Primitive;
    constructor(name: Primitive) {
        this.name = name;
    }
}

export class FunctionType implements GType {

    returnType: GType;
    parameters: GType[];
    constructor(returnType: GType, parameters: GType[]) {
        this.returnType = returnType;
        this.parameters = parameters;
    }
}


export class TempOmittedType implements GType {
    name: string;
    constructor() {
        this.name = "...";
    }
   
}

