import { GValue } from "./compiler";


export class Environment {
    private variables: Map<string, GValue> = new Map();
    constructor(readonly enclosing: Environment | null) {
        this.enclosing = enclosing;
    }
    define(name: string, value: GValue): void {
        this.variables.set(name, value);
    }
    get(name: string): GValue {
        if (this.variables.has(name)) {
            return this.variables.get(name)!;
        }
        if (this.enclosing) {
            return this.enclosing.get(name);
        }
        throw new Error(`Variable ${name} not found`);
    }
    set(name: string, value: GValue): void {
        this.variables.set(name, value);
    }

    ancestor(distance: number): Environment {
        let environment = this as Environment;

        for (let i = 0; i < distance && environment.enclosing; i++) {
            environment = environment.enclosing;
        }
        return environment;
    }

    getAt(distance: number, name: string): GValue {
        return this.ancestor(distance).variables.get(name)!;
    }

}