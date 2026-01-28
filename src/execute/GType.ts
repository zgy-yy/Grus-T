


export interface GType {
    a:number
}

export type Primitive = 'void'| 'bool'| 'i8'| 'i16'| 'i32'| 'i64'| 'float'| 'double'| 'string';

export class SimpleGType implements GType {
    a=1;
    name: Primitive;
    constructor(name: Primitive) {
        this.name = name;
    }
}

export class FunctionGType implements GType {
    a=2;
    returnType: GType;
    parameters: GType[];
    constructor(returnType: GType, parameters: GType[]) {
        this.returnType = returnType;
        this.parameters = parameters;
    }
}


export class TempOmittedGType implements GType {
    a=3;
    name: string;
    constructor() {
        this.name = "...";
    }
   
}

