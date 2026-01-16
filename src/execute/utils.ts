import { CompilerError, IrType } from "./compiler";

    
export function binaryOperator(type: IrType, operator: '+' | '-' | '*' | '/' | '%' | '>>' | '<<' | '==' | '!=' | '>' | '>=' | '<' | '<='): string {
    const floatArithmetic = ["float", "double"].includes(type);
    switch (operator) {
        case '+':
            return floatArithmetic ? "fadd" : "add";
        case '-':
            return floatArithmetic ? "fsub" : "sub";
        case '*':
            return floatArithmetic ? "fmul" : "mul";
        case '/':
            return floatArithmetic ? "fdiv" : "sdiv";
        case '%':
            return floatArithmetic ? "frem" : "srem";
        case '>>':
            return "ashr"; //算术右移
        case '<<':
            return "shl";
        case '==':
            return floatArithmetic ? "fcmp oeq" : "icmp eq";
        case '!=':
            return floatArithmetic ? "fcmp une" : "icmp ne";
        case '>':
            return floatArithmetic ? "fcmp ogt" : "icmp sgt";
        case '>=':
            return floatArithmetic ? "fcmp oge" : "icmp sge";
        case '<':
            return floatArithmetic ? "fcmp olt" : "icmp slt";
        case '<=':
            return floatArithmetic ? "fcmp ole" : "icmp sle";


        default:
            throw new CompilerError(operator, `Unsupported operator: ${operator}`);
    }

}


