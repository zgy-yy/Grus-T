import { AssignExpr, BinaryExpr, CallExpr, ConditionalExpr, Expr, ExprVisitor, GetExpr, LiteralExpr, LogicalExpr, PostfixExpr, PrefixExpr, SetExpr, ThisExpr, UnaryExpr, VariableExpr } from "@/ast/Expr";
import { FunctionTypeExpr, PrimitiveTypeExpr, TempOmittedTypeExpr, TypeExpr, TypesExprVisitor, } from "@/ast/TypeExpr";
import { BlockStmt, BreakStmt, ClassStmt, ContinueStmt, DoWhileStmt, ExpressionStmt, ForStmt, FunctionStmt, GotoStmt, IfStmt, LabelStmt, LoopStmt, ReturnStmt, StmtVisitor, VarStmt, WhileStmt } from "@/ast/Stmt";
import { Stmt } from "@/ast/Stmt";
import { CompilerErrorHandler } from "@/parser/ErrorHandler";
import { TokenType } from "@/ast/TokenType";
import { Token } from "@/ast/Token";
import { binaryOperator } from "./utils";


export class CompilerError extends Error {
    public token: Token;
    constructor(token: Token, message: string) {
        super(message);
        this.token = token;
    }
}


export type Reg = string;
export type IrFragment = string;
export type IrType = string;

//表达式编译结果
class ExprCompose {
    ir: IrFragment;
    reg: Reg;
    irtype: IrType;
    addr: Reg;
    constructor(irtype: IrType, reg: Reg, ir: IrFragment, addr?: Reg) {
        this.ir = ir;
        this.reg = reg;
        this.irtype = irtype;
        this.addr = addr ?? "";
    }
}

//Ir 变量
class IrVar {
    name: string;
    type: TypeExpr;
    captured: boolean;
    constructor(name: string, type: TypeExpr, captured: boolean) {
        this.name = name;
        this.type = type;
        this.captured = captured;
    }
}

export class Compiler implements ExprVisitor<ExprCompose>, StmtVisitor<IrFragment>, TypesExprVisitor<IrFragment> {
    static constStrI: number = 0;
    static regI: number = 0;
    static ifI: number = 0;
    static forI: number = 0;
    static whileI: number = 0;
    static doWhileI: number = 0;
    static andI: number = 0;
    static loopI: number = 0;
    static orI: number = 0;
    LoopStack: {
        startLabel: string,
        endLabel: string,
    }[] = [];
    scopes: Map<string, IrVar>[] = []; // sourceName -> compiledName
    globals: string[] = [
        "declare i32 @printf(i8*, ...)",
        "declare noalias i8* @malloc(i64)",
        "declare void @free(i8*)"
    ];
    code: string = "";
    captured: VarStmt[] = [];
    constructor(private readonly errorHandler: CompilerErrorHandler) {
    }

    compileProgram(stmts: Stmt[]): string {
        this.beginScope(stmts);
        // 定义 printf 函数
        this.define("printf", new FunctionTypeExpr(new Token(TokenType.Identifier, "printf", null, 0, 0), new PrimitiveTypeExpr(new Token(TokenType.Identifier, "i32", null, 0, 0)), [new PrimitiveTypeExpr(new Token(TokenType.Identifier, "i8*", null, 0, 0)), new PrimitiveTypeExpr(new Token(TokenType.Identifier, "...", null, 0, 0))]), false);
        this.code = stmts.map(stmt => stmt.accept(this)).join("\n");
        const globalCode = this.globals.join("\n");
        this.code = globalCode + this.code;
        this.endScope();
        return this.code;
    }

    compileStmt(stmt: Stmt): IrFragment {
        return stmt.accept(this);
    }
    visitBlockStmt(stmt: BlockStmt): IrFragment {
        this.beginScope(stmt.statements);
        const code = stmt.statements.map(stmt => stmt.accept(this)).join("\n");
        this.endScope();
        return code;
    }
    visitVarStmt(stmt: VarStmt): IrFragment {

        if (this.scopes.length > 1) { //局部变量

            return stmt.vars.map(var_ => {
                const code: IrFragment[] = [];
                const varName = var_.name.lexeme;
                const var_ir_type = var_.type.accept(this);
                const init_comp = var_.initializer?.accept(this) ?? new ExprCompose("void", "zeroinitializer", "");
                let ir_name = this.define(varName, var_.type, var_.capture);
                if (var_.capture) {
                    const mem = this.memSizeOf(var_.type);
                    code.push(mem.ir);
                    const raw_mem_reg = this.reg();
                    code.push(`${raw_mem_reg} = call noalias i8* @malloc(i64 ${mem.reg})`);
                    code.push(`${ir_name} = bitcast ${raw_mem_reg} to {i32,${var_ir_type}}*`);
                    code.push(init_comp.ir);
                    const comp = this.matchingTargetType(var_ir_type, init_comp.irtype, init_comp.reg);
                    const num_ptr_reg = this.reg();
                    code.push(`${num_ptr_reg} = getelementptr {i32,${var_ir_type}}, {i32,${var_ir_type}}* ${ir_name}, i32 0, i32 0`);
                    code.push(`store i32 ${1}, i32* ${num_ptr_reg}`);
                    const data_ptr_reg = this.reg();
                    code.push(`${data_ptr_reg} = getelementptr {i32,${var_ir_type}}, {i32,${var_ir_type}}* ${ir_name}, i32 0, i32 1`);
                    code.push(`store ${var_ir_type} ${comp.reg}, ${var_ir_type}* ${num_ptr_reg}`);
                } else {
                    code.push(`${ir_name} = alloca ${var_ir_type}`);
                    code.push(init_comp.ir);
                    const comp = this.matchingTargetType(var_ir_type, init_comp.irtype, init_comp.reg);
                    code.push(comp.ir);
                    code.push(`store ${var_ir_type} ${comp.reg}, ${var_ir_type}* ${ir_name}`);

                }

                return code.join("\n");
            }).join("\n");
        } else { //全局变量
            return stmt.vars.map(var_ => {
                const varName = var_.name.lexeme;
                const var_ir_type = var_.type.accept(this);
                const init_comp = var_.initializer?.accept(this) ?? new ExprCompose("void", "zeroinitializer", "");
                const init_reg = init_comp.reg;
                let ir_name = this.define(varName, var_.type, false);
                return `${ir_name} = global ${var_ir_type} ${init_reg}`
            }).join("\n");
        }
    }
    visitFunctionStmt(stmt: FunctionStmt): IrFragment {
        this.beginScope(stmt.body);
        Compiler.regI = 0;
        Compiler.ifI = 0;
        const fn_name = stmt.fun.name.lexeme;
        const returnType = stmt.fun.returnType.accept(this);
        const param_code_ir: IrFragment[] = [];
        const parameters = stmt.fun.parameters.map(param => {
            const ir_param_reg = `%${param.name.lexeme}.p`;
            const ir_param_type = param.type.accept(this);
            const ir_param_name = this.define(param.name.lexeme, param.type, false);
            param_code_ir.push(`${ir_param_name} = alloca ${ir_param_type}`);
            param_code_ir.push(`store ${ir_param_type} ${ir_param_reg}, ${ir_param_type}* ${ir_param_name}`);
            return {
                irtype: ir_param_type,
                reg: ir_param_reg,
            }
        });

        const fn_body = stmt.body.map(stmt => stmt.accept(this)).join("\n");
        const code =
            `define ${returnType} @${fn_name}(${parameters.map(param => `${param.irtype} ${param.reg}`).join(", ")}) {
    entry:
    ${param_code_ir.join("\n")}
    ${fn_body}
    ret ${returnType} ${returnType === "void" ? "" : "zeroinitializer"}
}`;
        this.endScope();
        this.globals.push(code);
        return "";
    }
    visitExpressionStmt(stmt: ExpressionStmt): IrFragment {
        const comp = stmt.expression.accept(this);
        let ir_code = comp.ir;
        return ir_code;
    }
    visitIfStmt(stmt: IfStmt): IrFragment {
        this.beginScope(stmt.thenBranch instanceof BlockStmt ? stmt.thenBranch.statements : [stmt.thenBranch]);
        const condition = stmt.condition.accept(this);
        const thenBranch = stmt.thenBranch.accept(this);
        this.endScope();
        let elseBranch = "";
        if (stmt.elseBranch) {
            this.beginScope(stmt.elseBranch instanceof BlockStmt ? stmt.elseBranch.statements : [stmt.elseBranch]);
            elseBranch = stmt.elseBranch.accept(this);
            this.endScope();
        }
        const ifI = Compiler.ifI++;
        const thenLabel = `if${ifI}.then`;
        const elseLabel = `if${ifI}.else`;
        const endLabel = `if${ifI}.end`;
        const code = `
        ${condition.ir}
        br i1 ${condition.reg}, label %${thenLabel}, label %${elseLabel}
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
        this.beginScope(stmt.body instanceof BlockStmt ? stmt.body.statements : [stmt.body]);
        const whileI = Compiler.whileI++;
        const conditionLabel = `while${whileI}.condition`;
        const bodyLabel = `while${whileI}.body`;
        const endLabel = `while${whileI}.end`;
        this.LoopStack.push({
            startLabel: conditionLabel,
            endLabel: endLabel,
        });
        const condition = stmt.condition.accept(this);
        const body = stmt.body.accept(this);
        const code = `
        br label %${conditionLabel}
        ${conditionLabel}:
            ${condition.ir}
            br i1 ${condition.reg}, label %${bodyLabel}, label %${endLabel}
        ${bodyLabel}:
            ${body}
            br label %${conditionLabel}
        ${endLabel}:
        `;
        this.LoopStack.pop();
        this.endScope();
        return code;
    }
    visitDoWhileStmt(stmt: DoWhileStmt): IrFragment {
        this.beginScope(stmt.body instanceof BlockStmt ? stmt.body.statements : [stmt.body]);
        const doWhileI = Compiler.doWhileI++;
        const conditionLabel = `doWhile${doWhileI}.condition`;
        const bodyLabel = `doWhile${doWhileI}.body`;
        const endLabel = `doWhile${doWhileI}.end`;
        this.LoopStack.push({
            startLabel: bodyLabel,
            endLabel: endLabel,
        });
        const body = stmt.body.accept(this);
        const condition = stmt.condition.accept(this);
        const code = `
        br label %${bodyLabel}
        ${bodyLabel}:
            ${body}
             br label %${conditionLabel}
        ${conditionLabel}:
            ${condition.ir}
            br i1 ${condition.reg}, label %${bodyLabel}, label %${endLabel}
        ${endLabel}:
        `;
        this.LoopStack.pop();
        this.endScope();
        return code;
    }
    visitForStmt(stmt: ForStmt): IrFragment {
        this.beginScope(stmt.body instanceof BlockStmt ? stmt.body.statements : [stmt.body]);
        const forI = Compiler.forI++;
        const conditionLabel = `for${forI}.condition`;
        const bodyLabel = `for${forI}.body`;
        const endLabel = `for${forI}.end`;
        this.LoopStack.push({
            startLabel: conditionLabel,
            endLabel: endLabel,
        });

        const initializer = stmt.initializer?.accept(this) ?? "";
        const condition = stmt.condition.accept(this);
        let increment = {
            ir: "",
            reg: "",
        };
        if (stmt.increment) {
            increment = stmt.increment.accept(this);
        }
        const body = stmt.body.accept(this);
        const code = `
        ${initializer}
        br label %${conditionLabel}
        ${conditionLabel}:
            ${condition.ir}
            br i1 ${condition.reg}, label %${bodyLabel}, label %${endLabel}
        ${bodyLabel}:
            ${body}
            ${increment.ir}
            br label %${conditionLabel}
        ${endLabel}:
        `;
        this.LoopStack.pop();
        this.endScope();
        return code;

    }

    visitLoopStmt(stmt: LoopStmt): IrFragment {
        this.beginScope(stmt.body instanceof BlockStmt ? stmt.body.statements : [stmt.body]);
        const loopI = Compiler.loopI++;
        const bodyLabel = `loop${loopI}.body`;
        const endLabel = `loop${loopI}.end`;
        this.LoopStack.push({
            startLabel: bodyLabel,
            endLabel: endLabel,
        });
        const body = stmt.body.accept(this);
        const code = `
        br label %${bodyLabel}
        ${bodyLabel}:
            ${body}
            br label %${bodyLabel}
        ${endLabel}:
        `;
        this.LoopStack.pop();
        this.endScope();
        return code;
    }
    visitBreakStmt(stmt: BreakStmt): IrFragment {
        const currentLoop = this.LoopStack[this.LoopStack.length - 1];
        return `br label %${currentLoop.endLabel}`;
    }
    visitContinueStmt(stmt: ContinueStmt): IrFragment {
        const currentLoop = this.LoopStack[this.LoopStack.length - 1];
        return `br label %${currentLoop.startLabel}`;
    }
    visitLabelStmt(stmt: LabelStmt): IrFragment {
        const code: IrFragment[] = [];
        code.push(`br label %${stmt.label.lexeme}`);
        code.push(`${stmt.label.lexeme}:`);
        if (stmt.body) {
            code.push(stmt.body.accept(this));
        }
        return code.join("\n");
    }
    visitGotoStmt(stmt: GotoStmt): IrFragment {
        return `br label %${stmt.label.lexeme}`;
    }
    visitReturnStmt(stmt: ReturnStmt): IrFragment {
        if (stmt.value) {
            const ir_code: IrFragment[] = [];
            const comp = stmt.value.accept(this);
            ir_code.push(comp.ir);
            ir_code.push(`ret ${comp.irtype} ${comp.reg}`);
            return ir_code.join("\n");
        } else {
            return `ret void`;
        }
    }
    visitClassStmt(stmt: ClassStmt): IrFragment {
        throw new Error("Method not implemented.");
    }


    // Expr

    visitAssignExpr(expr: AssignExpr): ExprCompose {
        const ir_code: IrFragment[] = [];
        const left_comp = expr.target.accept(this);
        const ir_type = left_comp.irtype;

        const ir_value = expr.value.accept(this);
        ir_code.push(ir_value.ir);
        ir_code.push(`store ${ir_type} ${ir_value.reg}, ${ir_type}* ${left_comp.addr}`);
        return new ExprCompose(ir_type, ir_value.reg, ir_code.join("\n"));
    }
    visitConditionalExpr(expr: ConditionalExpr): ExprCompose {
        throw new Error("Method not implemented.");
        // return `${expr.condition.accept(this)} ? ${expr.trueExpr.accept(this)} : ${expr.falseExpr.accept(this)}`;
    }
    visitLogicalExpr(expr: LogicalExpr): ExprCompose {
        throw new Error("Method not implemented.");
    }
    visitBinaryExpr(expr: BinaryExpr): ExprCompose {
        const code: IrFragment[] = [];
        const left_comp = expr.left.accept(this);
        const right_comp = expr.right.accept(this);
        let expr_ir_type = left_comp.irtype;
        let expr_reg = this.reg();
        code.push(left_comp.ir);
        if (expr.operator.type === TokenType.Comma) {
            code.push(right_comp.ir);
            return new ExprCompose(right_comp.irtype, right_comp.reg, code.join("\n"));
        } else {
            if (expr.operator.type === TokenType.And) {
                const andI = Compiler.andI++;
                const startLabel = `and${andI}.start`;
                const checkLabel = `and${andI}.check`;
                const exitLabel = `and${andI}.exit`;
                const result_reg = this.reg();
                // 逻辑 AND: 如果 left 为 false，直接返回 false；否则计算 right 并返回其结果
                const ir_code =
                    `
                br label %${startLabel}
                ${startLabel}:
                br i1 ${left_comp.reg}, label %${checkLabel}, label %${exitLabel}
                ${checkLabel}:
                    ${right_comp.ir}
                    br label %${exitLabel}
                ${exitLabel}:
                    ${result_reg} = phi i1 [false, %${startLabel}], [${right_comp.reg}, %${checkLabel}]
                `;
                code.push(ir_code);
                return new ExprCompose("i1", result_reg, code.join("\n"));
            } else if (expr.operator.type === TokenType.Or) {
                const orI = Compiler.orI++;
                const startLabel = `or${orI}.start`;
                const checkLabel = `or${orI}.check`;
                const exitLabel = `or${orI}.exit`;
                const result_reg = this.reg();
                const ir_code = `
                br label %${startLabel}
                ${startLabel}:
                    br i1 ${left_comp.reg}, label %${exitLabel}, label %${checkLabel}
                ${checkLabel}:
                    ${right_comp.ir}
                    br label %${exitLabel}
                ${exitLabel}:
                    ${result_reg} = phi i1 [true, %${startLabel}], [${right_comp.reg}, %${checkLabel}]
                `;
                code.push(ir_code);
                return new ExprCompose("i1", result_reg, code.join("\n"));
            } else {
                code.push(right_comp.ir);
                const max_comp = this.matchingMaxType(left_comp, right_comp);
                code.push(max_comp.ir);
                const opt_type = max_comp.irtype;
                expr_ir_type = max_comp.irtype;
                let opt = "";
                switch (expr.operator.type) {
                    case TokenType.Plus:
                        opt = binaryOperator(opt_type, '+');
                        break;
                    case TokenType.Minus:
                        opt = binaryOperator(opt_type, '-');
                        break;
                    case TokenType.Star:
                        opt = binaryOperator(opt_type, '*');
                        break;
                    case TokenType.Slash:
                        //有符号除法
                        opt = binaryOperator(opt_type, '/');
                        break;
                    case TokenType.Percent:
                        opt = binaryOperator(opt_type, '%');
                        break;
                    case TokenType.GreaterGreater:
                        opt = binaryOperator(opt_type, '>>');
                        break;
                    case TokenType.LessLess:
                        opt = binaryOperator(opt_type, '<<');
                        break;
                    case TokenType.EqualEqual:
                        opt = binaryOperator(opt_type, '==');
                        expr_ir_type = "i1"
                        break;
                    case TokenType.BangEqual:
                        opt = binaryOperator(opt_type, '!=');
                        expr_ir_type = "i1"
                        break;
                    case TokenType.Greater:
                        opt = binaryOperator(opt_type, '>');
                        expr_ir_type = "i1"
                        break;
                    case TokenType.GreaterEqual:
                        opt = binaryOperator(opt_type, '>=');
                        expr_ir_type = "i1"
                        break;
                    case TokenType.Less:
                        opt = binaryOperator(opt_type, '<');
                        expr_ir_type = "i1"
                        break;
                    case TokenType.LessEqual:
                        opt = binaryOperator(opt_type, '<=');
                        expr_ir_type = "i1"
                        break;
                    case TokenType.BitOr:
                        opt = "or";
                        break;
                    case TokenType.BitAnd:
                        opt = "and";
                        break;
                    case TokenType.Caret:
                        opt = "xor";
                        break;
                }

                code.push(`${expr_reg} = ${opt} ${opt_type} ${left_comp.reg}, ${right_comp.reg}`);
                return new ExprCompose(expr_ir_type, expr_reg, code.join("\n"));
            }
        }
    }
    visitUnaryExpr(expr: UnaryExpr): ExprCompose {
        const ir_code: IrFragment[] = [];
        const comp = expr.right.accept(this);
        ir_code.push(comp.ir);
        const ir_type = comp.irtype;
        const resultReg = this.reg();
        const floatPoint = ["float", "double"];
        switch (expr.operator.type) {
            case TokenType.Minus:
                // 在 LLVM IR 中，整数取反使用 sub 指令：sub i32 0, %value
                if (floatPoint.includes(ir_type)) {
                    ir_code.push(`${resultReg} = fneg ${ir_type} ${comp.reg}`);
                } else {
                    ir_code.push(`${resultReg} = sub ${ir_type} 0, ${comp.reg}`);
                }
                break;
            case TokenType.Tilde:
                ir_code.push(`${resultReg} = xor ${ir_type} ${comp.reg}, -1`);
                break;
            case TokenType.Bang:
                ir_code.push(`${resultReg} = xor ${ir_type} ${comp.reg}, 1`);
                break;
            default:
                throw this.error(expr.operator, `Unsupported unary operator: ${expr.operator.type}`);
        }
        return new ExprCompose(ir_type, resultReg, ir_code.join("\n"));
    }

    visitPostfixExpr(expr: PostfixExpr): ExprCompose {
        const left_comp = expr.target.accept(this);
        const ir_type = left_comp.irtype;
        const resultReg = this.reg();
        let opt = ""
        if (expr.operator.type === TokenType.PlusPlus) {
            opt = "add"
        } else {
            opt = "sub"
        }
        const tempReg = this.reg();
        const ir_code: IrFragment[] = [];
        ir_code.push(`${resultReg} = load ${ir_type} , ${ir_type}* ${left_comp.addr}`);
        ir_code.push(`${tempReg} = ${opt} ${ir_type} ${resultReg}, 1`);
        ir_code.push(`store ${ir_type} ${tempReg}, ${ir_type}* ${left_comp.addr}`);

        return new ExprCompose(ir_type, resultReg, ir_code.join("\n"));
    }

    visitPrefixExpr(expr: PrefixExpr): ExprCompose {
        const ir_code: IrFragment[] = [];
        const left_comp = expr.target.accept(this);
        const ir_type = left_comp.irtype;
        const resultReg = this.reg();
        let opt = ""
        if (expr.operator.type === TokenType.PlusPlus) {
            opt = "add"
        } else {
            opt = "sub"
        }
        const tempReg = this.reg();
        ir_code.push(`${tempReg} = load ${ir_type} , ${ir_type}* ${left_comp.addr}`);
        ir_code.push(`${resultReg} = ${opt} ${ir_type} ${tempReg}, 1`);
        ir_code.push(`store ${ir_type} ${resultReg}, ${ir_type}* ${left_comp.addr}`);
        return new ExprCompose(ir_type, resultReg, ir_code.join("\n"));
    }

    visitCallExpr(expr: CallExpr): ExprCompose {
        const reg = this.reg();
        const callee = expr.callee.accept(this);
        const args = expr.arguments.map(argument => argument.accept(this));
        const ir_code: IrFragment[] = [];

        let ir_type = "void";

        // 检查是否是可变参数函数（如printf）
        let isVariadic = false;
        if (expr.callee instanceof VariableExpr) {
            const irVar = this.findIrVar(expr.callee.name);
            if (irVar.type instanceof FunctionTypeExpr) {
                // 检查参数列表中是否包含"..."（可变参数）
                isVariadic = irVar.type.parameters.some(param =>
                    param instanceof PrimitiveTypeExpr && param.name.lexeme === "..."
                );
                ir_type = irVar.type.returnType.accept(this);
            }
        }

        const arg_comps = args.map(arg => {
            ir_code.push(arg.ir);

            // 对于可变参数函数，将较小的整数类型提升为i32
            let finalType = arg.irtype;
            let finalReg = arg.reg;

            if (isVariadic && (arg.irtype === "i1" || arg.irtype === "i8" || arg.irtype === "i16")) {
                const extendReg = `%extend_reg_${Compiler.regI++}`;
                // i1使用zext，其他使用sext
                const extendOp = arg.irtype === "i1" ? "zext" : "sext";
                ir_code.push(`${extendReg} = ${extendOp} ${arg.irtype} ${arg.reg} to i32`);
                finalType = "i32";
                finalReg = extendReg;
            }

            return {
                irtype: finalType,
                reg: finalReg,
            };
        });

        const call_ir = `call ${callee.irtype} ${callee.reg}(${arg_comps.map(arg => `${arg.irtype} ${arg.reg}`).join(", ")})`;
        if (ir_type === "void") {
            ir_code.push(call_ir);
            return new ExprCompose(ir_type, reg, ir_code.join("\n"));
        }

        ir_code.push(`${reg} = ${call_ir}`);
        return new ExprCompose(ir_type, reg, ir_code.join("\n"));
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
    visitVariableExpr(expr: VariableExpr): ExprCompose {
        const irVar = this.findIrVar(expr.name);
        if (irVar.type instanceof FunctionTypeExpr) {
            const ir_type = irVar.type.accept(this);
            // 对于函数类型，直接返回函数名（如 @printf），不需要创建寄存器
            return new ExprCompose(ir_type, irVar.name, "", irVar.name);
        }
        if (irVar.captured) {
          
        }
        const reg = this.reg();
        const ir_type = irVar.type.accept(this);
        const ir_code = `${reg} = load ${ir_type} , ${ir_type}* ${irVar.name}\n`;
        return new ExprCompose(ir_type, reg, ir_code, irVar.name);
    }

    visitLiteralExpr(expr: LiteralExpr): ExprCompose {
        const globalReg = `@.constant_${Compiler.constStrI++}`
        if (typeof expr.value === "string") {
            const g_ir = `${globalReg} = private unnamed_addr constant [${expr.value.length + 2} x i8] c"${expr.value}\\0A\\00", align 1\n`;
            this.globals.push(g_ir);
            // 不在这里返回 g_ir，因为它会被添加到全局作用域
            return new ExprCompose("i8*", globalReg, "");
        } else if (typeof expr.value === "number") {
            if (!Number.isInteger(expr.value)) {
                return new ExprCompose("float", `${expr.value.toString()}`, "");
            } else {
                return new ExprCompose("i32", expr.value?.toString() ?? "", "");
            }
        } else if (typeof expr.value === "boolean") {
            return new ExprCompose("i1", expr.value ? "1" : "0", "");
        }
        return new ExprCompose("void64", "", "");
    }

    //编译类型表达式

    visitPrimitiveTypeExpr(expr: PrimitiveTypeExpr): string {
        if (expr.name.lexeme === "string") {
            return "i8*";
        }
        if (expr.name.lexeme === "bool") {
            return "i1";
        }
        return expr.name.lexeme;
    }
    visitFunctionTypeExpr(expr: FunctionTypeExpr): string {
        return expr.returnType.accept(this) + "(" + expr.parameters.map(parameter => parameter.accept(this)).join(", ") + ")";
    }

    visitTempOmittedTypeExpr(expr: TempOmittedTypeExpr): string {
        return "...";
    }

    //作用域
    beginScope(stmts: Stmt[]): void {
        this.scopes.push(new Map<string, IrVar>());
        for (const stmt of stmts) {
            if (stmt instanceof FunctionStmt) {
                this.define(stmt.fun.name.lexeme, stmt.fun.type, false);
            }
        }
    }
    endScope(): void {
        this.scopes.pop();
    }

    define(name: string, type: TypeExpr, captured: boolean): Reg {
        const currentScope = this.scopes[this.scopes.length - 1];
        const distance = this.findVarDistance(name);
        const prefix = this.scopes.length == 1 || type instanceof FunctionTypeExpr ? "@" : "%";
        const ir_name = `${prefix}${captured ? "ptr_" : ""}${name}${distance > 0 ? distance : ''}`;
        currentScope.set(name, new IrVar(ir_name, type, captured));
        return ir_name;
    }
    findIrVar(sourceName: Token): IrVar {
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            const scope = this.scopes[i];
            const ir_var = scope.get(sourceName.lexeme);
            if (ir_var) {
                return ir_var;
            }
        }
        throw this.error(sourceName, `Variable ${sourceName} not found`);
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

    //匹配最大类型
    matchingMaxType(left_comp: ExprCompose, right_comp: ExprCompose): ExprCompose {
        const [ir_type, compared] = compareType(left_comp.irtype, right_comp.irtype);
        if (compared === "l") {
            const comp = this.matchingTargetType(ir_type, left_comp.irtype, left_comp.reg);
            left_comp.reg = comp.reg;
            return comp
        } else {
            const comp = this.matchingTargetType(ir_type, right_comp.irtype, right_comp.reg);
            right_comp.reg = comp.reg;
            return comp
        }
    }

    matchingTargetType(targetType: string, sourceType: string, reg: Reg): ExprCompose {
        const floatPoint = ["i8", "i16", "i32", "i64", "float", "double"];
        const targetI = floatPoint.indexOf(targetType);
        const sourceI = floatPoint.indexOf(sourceType);
        const turnReg = this.reg();
        if (sourceType === "void") {
            return new ExprCompose(targetType, reg, "");
        }
        if (targetI == sourceI) {
            return new ExprCompose(targetType, reg, "");
        } else if (targetI < sourceI) { //降级
            if (targetI < 4) {
                if (sourceI < 4) {//整数间转换
                    const ir = `${turnReg} = trunc ${sourceType} ${reg} to ${targetType}`;
                    return new ExprCompose(targetType, turnReg, ir);
                } else { //浮点数转整数
                    const ir = `${turnReg} = fptosi ${sourceType} ${reg} to ${targetType}`;
                    return new ExprCompose(targetType, turnReg, ir);
                }
            } else {
                const ir = `${turnReg} = fptrunc ${sourceType} ${reg} to ${targetType}`;
                return new ExprCompose(targetType, turnReg, ir);
            }
        } else { //升级
            if (targetI > 3) {
                if (sourceI > 3) {//浮点数间转换
                    const ir = `${turnReg} = fpext ${sourceType} ${reg} to ${targetType}`;
                    return new ExprCompose(targetType, turnReg, ir);
                } else { //整数转浮点数
                    const ir = `${turnReg} = sitofp ${sourceType} ${reg} to ${targetType}`;
                    return new ExprCompose(targetType, turnReg, ir);
                }
            } else {
                // 对于 i1 (布尔值)，使用 zext (零扩展)，其他整数类型使用 sext (符号扩展)
                const extendOp = sourceType === "i1" ? "zext" : "sext";
                const ir = `${turnReg} = ${extendOp} ${sourceType} ${reg} to ${targetType}`;
                return new ExprCompose(targetType, turnReg, ir);
            }
        }
    }

    reg() {
        return `%r${Compiler.regI++}`;
    }

    memSizeOf(type: TypeExpr): ExprCompose {
        const sizePtrReg = this.reg();
        const sizeIntReg = this.reg();
        const ir_code: IrFragment[] = [];

        if (type instanceof PrimitiveTypeExpr) {
            const ir_type = type.name.lexeme;
            ir_code.push(`${sizePtrReg} = getelementptr {i32,${ir_type}},{i32,${ir_type}}* null, i64 1)`);
            ir_code.push(`${sizeIntReg} = ptrtoint {i32,${ir_type}}* ${sizePtrReg} to i64`);
            return new ExprCompose("i64", sizeIntReg, ir_code.join("\n"));
        }
        throw new Error("Unsupported type: " + type.toString());
    }


    error(token: Token, message: string): void {
        this.errorHandler(token, message);
        throw new CompilerError(token, message);
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
