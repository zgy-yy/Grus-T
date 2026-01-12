import { AssignExpr, BinaryExpr, CallExpr, ConditionalExpr, Expr, ExprVisitor, GetExpr, GroupingExpr, LiteralExpr, LogicalExpr, PostfixExpr, SetExpr, ThisExpr, UnaryExpr, VariableExpr } from "@/ast/Expr";
import { FunctionType, PrimitiveType, TempOmittedType, TypeExpr, TypesVisitor, VoidType } from "@/ast/TypeExpr";
import { BlockStmt, BreakStmt, ClassStmt, ContinueStmt, ExpressionStmt, ForStmt, FunctionStmt, IfStmt, ReturnStmt, StmtVisitor, VarStmt, WhileStmt } from "@/ast/Stmt";
import { Stmt } from "@/ast/Stmt";
import { CompilerErrorHandler } from "@/parser/ErrorHandler";
import { TokenType } from "@/ast/TokenType";

type Reg = string;
type IrFragment = string;
type IrType = string;

//表达式编译结果
class ExprCompose {
    ir: IrFragment;
    reg: Reg;
    irtype: IrType;
    constructor(irtype: IrType, reg: Reg, ir: IrFragment,) {
        this.ir = ir;
        this.reg = reg;
        this.irtype = irtype;
    }
}

//Ir 变量
class IrVar {
    name: string;
    type: TypeExpr;
    constructor(name: string, type: TypeExpr) {
        this.name = name;
        this.type = type;
    }
}

export class Compiler implements ExprVisitor<ExprCompose>, StmtVisitor<IrFragment>, TypesVisitor<IrFragment> {
    static constStrI: number = 0;
    static regI: number = 0;
    static ifI: number = 0;
    scopes: Map<string, IrVar>[] = []; // sourceName -> compiledName
    globals: string[] = ["declare i32 @printf(i8*, ...)\n"];
    code: string = "";
    constructor(private readonly error: CompilerErrorHandler) {
        // this.error = error;
    }

    compileProgram(nodes: Stmt[]): string {
        this.beginScope();
        this.scopes[this.scopes.length - 1].set("printf", new IrVar("@printf", new FunctionType(new PrimitiveType("i32"), [new PrimitiveType("i8*"), new PrimitiveType("...")])));
        for (const stmt of nodes) {
            this.code += this.compileStmt(stmt);
        }
        for (const global of this.globals.reverse()) {
            this.code = global + this.code;
        }
        this.endScope();
        return this.code;
    }

    compileStmt(stmt: Stmt): IrFragment {
        return stmt.accept(this);
    }
    visitBlockStmt(stmt: BlockStmt): IrFragment {
        this.beginScope();
        let ir_code = "";
        for (const statement of stmt.statements) {
            ir_code += statement.accept(this);
        }
        this.endScope();
        return ir_code;
    }
    visitVarStmt(stmt: VarStmt): IrFragment {
        const varName = stmt.name.lexeme;
        const var_ir_type = stmt.type.accept(this);

        const init_comp = stmt.initializer?.accept(this) ?? new ExprCompose("void", "zeroinitializer", "");
        const init_reg = init_comp.reg;
        const init_ir_type = init_comp.irtype;
        let ir_code = init_comp.ir;


        const d = this.findVarDistance(varName);
        let ir_name = `%${varName}${d > 0 ? d : ''}`;
        if (this.scopes.length > 1) {
            const scope = this.scopes[this.scopes.length - 1];
            scope.set(varName, new IrVar(ir_name, stmt.type));
            ir_code += `${ir_name} = alloca ${var_ir_type}\n`;

            if (init_reg != "zeroinitializer") {
                const comp = this.matchingTargetType(var_ir_type, init_ir_type, init_reg);
                ir_code += comp.ir;
                ir_code += `store ${var_ir_type} ${comp.reg}, ${var_ir_type}* ${ir_name}\n`;
            }
        } else {
            ir_name = `@.${varName}`;
            const scope = this.scopes[this.scopes.length - 1];
            scope.set(varName, new IrVar(ir_name, stmt.type));
            ir_code = `${ir_name} = global ${var_ir_type} ${init_reg}\n`;
        }

        return ir_code;
    }
    visitFunctionStmt(stmt: FunctionStmt): IrFragment {
        this.beginScope();
        Compiler.regI = 0;
        Compiler.ifI = 0;
        const fn_name = stmt.name.lexeme;
        const fn_type = stmt.returnType.accept(this);
        const fn_body = stmt.body.map(stmt => stmt.accept(this)).join("\n");
        const code = `define ${fn_type} @${fn_name}() {
        entry:
        ${fn_body}
        ret ${fn_type} 0
       }`;
        this.endScope();
        return code;
    }
    visitExpressionStmt(stmt: ExpressionStmt): IrFragment {
        const comp = stmt.expression.accept(this);
        let ir_code = comp.ir;
        return ir_code;
    }
    visitIfStmt(stmt: IfStmt): IrFragment {
        const condition = stmt.condition.accept(this);
        const thenBranch = stmt.thenBranch.accept(this);
        const elseBranch = stmt.elseBranch?.accept(this) ?? "";
        const ifI = Compiler.ifI++;
        const thenLabel = `if${ifI}.then`;
        const elseLabel = `if${ifI}.else`;
        const endLabel = `if${ifI}.end`;
        const compReg = this.reg();
        const code = `
        ${condition.ir}
        ${compReg}= ${binaryOperator(condition.irtype, '!=')} ${condition.irtype} ${condition.reg}, 0\n
        br i1 ${compReg}, label %${thenLabel}, label %${elseLabel}
        ${thenLabel}:
            ${thenBranch}
            br label %${endLabel}
        ${elseLabel}:
            ${elseBranch}
            br label %${endLabel}
        ${endLabel}:
        `;
        return code;
    }
    visitWhileStmt(stmt: WhileStmt): IrFragment {
        throw new Error("Method not implemented.");
    }
    visitForStmt(stmt: ForStmt): IrFragment {
        throw new Error("Method not implemented.");
    }
    visitBreakStmt(stmt: BreakStmt): IrFragment {
        throw new Error("Method not implemented.");
    }
    visitContinueStmt(stmt: ContinueStmt): IrFragment {
        throw new Error("Method not implemented.");
    }
    visitReturnStmt(stmt: ReturnStmt): IrFragment {
        throw new Error("Method not implemented.");
    }
    visitClassStmt(stmt: ClassStmt): IrFragment {
        throw new Error("Method not implemented.");
    }


    // Expr

    visitAssignExpr(expr: AssignExpr): ExprCompose {
        const irVar = this.findIrVar(expr.name.lexeme);
        const ir_type = irVar.type.accept(this);

        const ir_value = expr.value.accept(this);
        let ir_code = ir_value.ir;
        ir_code += `store ${ir_type} ${ir_value.reg}, ${ir_type}* ${irVar.name}\n`;
        return new ExprCompose(ir_type, ir_value.reg, ir_code);
    }
    visitConditionalExpr(expr: ConditionalExpr): ExprCompose {
        throw new Error("Method not implemented.");
        // return `${expr.condition.accept(this)} ? ${expr.trueExpr.accept(this)} : ${expr.falseExpr.accept(this)}`;
    }
    visitLogicalExpr(expr: LogicalExpr): ExprCompose {
        throw new Error("Method not implemented.");
    }
    visitBinaryExpr(expr: BinaryExpr): ExprCompose {
        const left_comp = expr.left.accept(this);
        const right_comp = expr.right.accept(this);
        let ir_code = left_comp.ir + right_comp.ir;

        const result_reg = this.reg();
        let [ir_type, compared] = compareType(left_comp.irtype, right_comp.irtype);
        if (compared === "l") {
            const comp = this.matchingTargetType(ir_type, left_comp.irtype, left_comp.reg);
            ir_code += comp.ir;
            left_comp.reg = comp.reg;
        } else {
            const comp = this.matchingTargetType(ir_type, right_comp.irtype, right_comp.reg);
            ir_code += comp.ir;
            right_comp.reg = comp.reg;
        }



        switch (expr.operator.type) {
            case TokenType.Plus:
                ir_code += `${result_reg} = ${binaryOperator(ir_type, '+')} ${ir_type} ${left_comp.reg}, ${right_comp.reg}\n`;
                break;
            case TokenType.Minus:
                ir_code += `${result_reg} = ${binaryOperator(ir_type, '-')} ${ir_type} ${left_comp.reg}, ${right_comp.reg}\n`;
                break;
            case TokenType.Star:
                ir_code += `${result_reg} = ${binaryOperator(ir_type, '*')} ${ir_type} ${left_comp.reg}, ${right_comp.reg}\n`;
                break;
            case TokenType.Slash:
                //有符号除法
                ir_code += `${result_reg} = ${binaryOperator(ir_type, '/')} ${ir_type} ${left_comp.reg}, ${right_comp.reg}\n`;
                break;
            case TokenType.Percent:
                ir_code += `${result_reg} = ${binaryOperator(ir_type, '%')} ${ir_type} ${left_comp.reg}, ${right_comp.reg}\n`;
                break;
            case TokenType.GreaterGreater:
                ir_code += `${result_reg} = ${binaryOperator(ir_type, '>>')} ${ir_type} ${left_comp.reg}, ${right_comp.reg}\n`;
                break;
            case TokenType.LessLess:
                ir_code += `${result_reg} = ${binaryOperator(ir_type, '<<')} ${ir_type} ${left_comp.reg}, ${right_comp.reg}\n`;
                break;
            case TokenType.EqualEqual:
                ir_code += `${result_reg} = ${binaryOperator(ir_type, '==')} ${ir_type} ${left_comp.reg}, ${right_comp.reg}\n`;
                ir_type = "i1"
                break;
            case TokenType.BangEqual:
                ir_code += `${result_reg} = ${binaryOperator(ir_type, '!=')} ${ir_type} ${left_comp.reg}, ${right_comp.reg}\n`;
                ir_type = "i1"
                break;
            case TokenType.Greater:
                ir_code += `${result_reg} = ${binaryOperator(ir_type, '>')} ${ir_type} ${left_comp.reg}, ${right_comp.reg}\n`;
                ir_type = "i1"
                break;
            case TokenType.GreaterEqual:
                ir_code += `${result_reg} = ${binaryOperator(ir_type, '>=')} ${ir_type} ${left_comp.reg}, ${right_comp.reg}\n`;
                ir_type = "i1"
                break;
            case TokenType.Less:
                ir_code += `${result_reg} = ${binaryOperator(ir_type, '<')} ${ir_type} ${left_comp.reg}, ${right_comp.reg}\n`;
                ir_type = "i1"
                break;
            case TokenType.LessEqual:
                ir_code += `${result_reg} = ${binaryOperator(ir_type, '<=')} ${ir_type} ${left_comp.reg}, ${right_comp.reg}\n`;
                ir_type = "i1"
                break;
            case TokenType.BitOr:
                ir_code += `${result_reg} = or ${ir_type} ${left_comp.reg}, ${right_comp.reg}\n`;
                break;
            case TokenType.BitAnd:
                ir_code += `${result_reg} = and ${ir_type} ${left_comp.reg}, ${right_comp.reg}\n`;
                break;
            case TokenType.Caret:
                ir_code += `${result_reg} = xor ${ir_type} ${left_comp.reg}, ${right_comp.reg}\n`;
                break;
        }
        return new ExprCompose(ir_type, result_reg, ir_code);
    }
    visitUnaryExpr(expr: UnaryExpr): ExprCompose {
        const comp = expr.right.accept(this);
        let ir_code = comp.ir;
        const ir_type = comp.irtype;
        const resultReg = this.reg();
        const floatPoint = ["float", "double"];
        switch (expr.operator.type) {
            case TokenType.Minus:
                // 在 LLVM IR 中，整数取反使用 sub 指令：sub i32 0, %value
                if (floatPoint.includes(ir_type)) {
                    ir_code += `${resultReg} = fneg ${ir_type} ${comp.reg}\n`;
                } else {
                    ir_code += `${resultReg} = sub ${ir_type} 0, ${comp.reg}\n`;
                }
                break;
            case TokenType.Tilde:
                ir_code += `${resultReg} = xor ${ir_type} ${comp.reg}, -1\n`;
                break;
            default:
                throw new Error(`Unsupported unary operator: ${expr.operator.type}`);
        }
        return new ExprCompose(ir_type, resultReg, ir_code);
    }

    visitPostfixExpr(expr: PostfixExpr): ExprCompose {
        throw new Error("Method not implemented.");
    }
    visitCallExpr(expr: CallExpr): ExprCompose {
        const reg = this.reg();
        const callee = expr.callee.accept(this);
        const args = expr.arguments.map(argument => argument.accept(this));
        let ir_code = "";

        // 检查是否是可变参数函数（如printf）
        let isVariadic = false;
        if (expr.callee instanceof VariableExpr) {
            const irVar = this.findIrVar(expr.callee.name.lexeme);
            if (irVar.type instanceof FunctionType) {
                // 检查参数列表中是否包含"..."（可变参数）
                isVariadic = irVar.type.parameters.some(param =>
                    param instanceof PrimitiveType && param.name === "..."
                );
            }
        }

        const arg_comps = args.map(arg => {
            ir_code += arg.ir;

            // 对于可变参数函数，将较小的整数类型提升为i32
            let finalType = arg.irtype;
            let finalReg = arg.reg;

            if (isVariadic && (arg.irtype === "i1" || arg.irtype === "i8" || arg.irtype === "i16")) {
                const extendReg = `%extend_reg_${Compiler.regI++}`;
                // i1使用zext，其他使用sext
                const extendOp = arg.irtype === "i1" ? "zext" : "sext";
                ir_code += `${extendReg} = ${extendOp} ${arg.irtype} ${arg.reg} to i32\n`;
                finalType = "i32";
                finalReg = extendReg;
            }

            return {
                irtype: finalType,
                reg: finalReg,
            };
        });

        ir_code += `${reg} = call ${callee.irtype} ${callee.reg}(${arg_comps.map(arg => `${arg.irtype} ${arg.reg}`).join(", ")})\n`;
        return new ExprCompose(callee.irtype, reg, ir_code);
    }
    visitSetExpr(expr: SetExpr): ExprCompose {
        throw new Error("Method not implemented.");
    }
    visitGetExpr(expr: GetExpr): ExprCompose {
        throw new Error("Method not implemented.");
    }
    visitThisExpr(expr: ThisExpr): ExprCompose {
        throw new Error("Method not implemented.");
    }
    visitGroupingExpr(expr: GroupingExpr): ExprCompose {
        throw new Error("Method not implemented.");
    }
    visitVariableExpr(expr: VariableExpr): ExprCompose {
        const irVar = this.findIrVar(expr.name.lexeme);
        if (irVar.type instanceof FunctionType) {
            const ir_type = irVar.type.accept(this);
            // 对于函数类型，直接返回函数名（如 @printf），不需要创建寄存器
            return new ExprCompose(ir_type, irVar.name, "");
        }
        const reg = this.reg();
        const ir_type = irVar.type.accept(this);
        const ir_code = `${reg} = load ${ir_type} , ${ir_type}* ${irVar.name}\n`;
        return new ExprCompose(ir_type, reg, ir_code);
    }

    visitLiteralExpr(expr: LiteralExpr): ExprCompose {
        const globalReg = `@.constant_${Compiler.constStrI++}`
        if (typeof expr.value === "string") {
            // private unnamed_addr constant [15 x i8] c"Hello, World!\0A\00", align 1
            const g_ir = `${globalReg} = private unnamed_addr constant [${expr.value.length + 2} x i8] c"${expr.value}\\0A\\00", align 1\n`;
            this.globals.push(g_ir);
            // 不在这里返回 g_ir，因为它会被添加到全局作用域
            return new ExprCompose("i8*", globalReg, "");
        } else if (typeof expr.value === "number") {
            if (!Number.isInteger(expr.value)) {
                return new ExprCompose("float", expr.value?.toString() ?? "", "");
            } else {
                return new ExprCompose("i32", expr.value?.toString() ?? "", "");
            }
        } else if (typeof expr.value === "boolean") {
            return new ExprCompose("i1", expr.value ? "1" : "0", "");
        }
        return new ExprCompose("void64", "", "");
    }

    //编译类型表达式

    visitPrimitiveType(expr: PrimitiveType): string {
        if (expr.name === "string") {
            return "i8*";
        }
        return expr.name;
    }
    visitFunctionType(expr: FunctionType): string {
        return expr.returnType.accept(this) + "(" + expr.parameters.map(parameter => parameter.accept(this)).join(", ") + ")";
    }

    visitVoidType(expr: VoidType): string {
        return "void";
    }

    visitTempOmittedType(expr: TempOmittedType): string {
        return "...";
    }

    //作用域
    beginScope(): void {
        this.scopes.push(new Map<string, IrVar>());
    }
    endScope(): void {
        this.scopes.pop();
    }

    define(name: string, type: TypeExpr): void {
        this.scopes[this.scopes.length - 1].set(name, new IrVar(name, type));
    }
    findIrVar(sourceName: string): IrVar {
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            const scope = this.scopes[i];
            const ir_var = scope.get(sourceName);
            if (ir_var) {
                return ir_var;
            }
        }
        throw new Error(`Variable ${sourceName} not found`);
    }

    findVarDistance(sourceName: string): number {
        let d = 0;
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            const scope = this.scopes[i];
            const var_ir = scope.get(sourceName);
            if (var_ir) {
                d++
            }
        }
        return d;
    }

    matchingTargetType(targetType: string, sourceType: string, reg: Reg): ExprCompose {
        const floatPoint = ["i8", "i16", "i32", "i64", "float", "double"];
        const targetI = floatPoint.indexOf(targetType);
        const sourceI = floatPoint.indexOf(sourceType);
        const turnReg = this.reg();
        if (targetI == sourceI) {
            return new ExprCompose(targetType, reg, "");
        } else if (targetI < sourceI) { //降级
            if (targetI < 4) {
                if (sourceI < 4) {//整数间转换
                    const ir = `${turnReg} = trunc ${sourceType} ${reg} to ${targetType}\n`;
                    return new ExprCompose(targetType, turnReg, ir);
                } else { //浮点数转整数
                    const ir = `${turnReg} = fptosi ${sourceType} ${reg} to ${targetType}\n`;
                    return new ExprCompose(targetType, turnReg, ir);
                }
            } else {
                const ir = `${turnReg} = fptrunc ${sourceType} ${reg} to ${targetType}\n`;
                return new ExprCompose(targetType, turnReg, ir);
            }
        } else { //升级
            if (targetI > 3) {
                if (sourceI > 3) {//浮点数间转换
                    const ir = `${turnReg} = fpext ${sourceType} ${reg} to ${targetType}\n`;
                    return new ExprCompose(targetType, turnReg, ir);
                } else { //整数转浮点数
                    const ir = `${turnReg} = sitofp ${sourceType} ${reg} to ${targetType}\n`;
                    return new ExprCompose(targetType, turnReg, ir);
                }
            } else {
                // 对于 i1 (布尔值)，使用 zext (零扩展)，其他整数类型使用 sext (符号扩展)
                const extendOp = sourceType === "i1" ? "zext" : "sext";
                const ir = `${turnReg} = ${extendOp} ${sourceType} ${reg} to ${targetType}\n`;
                return new ExprCompose(targetType, turnReg, ir);
            }
        }
    }

    reg() {
        return `%r${Compiler.regI++}`;
    }
}

//比较两个类型，返回最大类型和 需要改变类型的  l 左边，r 右边
function compareType(type1: string, type2: string): [IrType, 'r' | 'l'] {
    const floatPoint = ["i1", "i8", "i16", "i32", "i64", "float", "double"];
    const index1 = floatPoint.indexOf(type1);
    const index2 = floatPoint.indexOf(type2);
    const maxType = floatPoint[Math.max(index1, index2)];
    const compared = index2 > index1 ? "l" : "r"
    return [maxType, compared];
}

function binaryOperator(type: IrType, operator: '+' | '-' | '*' | '/' | '%' | '>>' | '<<' | '==' | '!=' | '>' | '>=' | '<' | '<='): string {
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
            throw new Error(`Unsupported operator: ${operator}`);
    }

}