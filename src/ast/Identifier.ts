import { Token } from "@/ast/Token";
import { GrusType } from "@/ast/GrusType";
import { Expr } from "./Expr";

export class Variable {
    name: Token;
    type: GrusType;
    constructor(name: Token, type: GrusType|null) {
        this.name = name;
        this.type = type as GrusType;
    }
}

export class Parameter {
    name: Token;
    type: GrusType;
    defaultValue: Expr | null;
    constructor(name: Token, type: GrusType|null, defaultValue: Expr | null) {
        this.name = name;
        this.type = type as GrusType;
        this.defaultValue = defaultValue;
    }
}