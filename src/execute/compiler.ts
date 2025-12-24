import { AssignExpr, BinaryExpr, CallExpr, ConditionalExpr, Expr, ExprVisitor, GetExpr, GroupingExpr, LiteralExpr, LogicalExpr, PostfixExpr, SetExpr, ThisExpr, UnaryExpr, VariableExpr } from "@/ast/Expr";
import { FunctionType, PrimitiveType, TempOmittedType, TypesVisitor, VoidType } from "@/ast/TypeExpr";
import { BlockStmt, BreakStmt, ClassStmt, ContinueStmt, ExpressionStmt, ForStmt, FunctionStmt, IfStmt, ReturnStmt, StmtVisitor, VarStmt, WhileStmt } from "@/ast/Stmt";
import { Stmt } from "@/ast/Stmt";
import { CompilerErrorHandler } from "@/parser/ErrorHandler";
import { TokenType } from "@/ast/TokenType";

type Reg = string;
type IrSegment = string;
export class Compiler implements ExprVisitor<[IrSegment, Reg]>, StmtVisitor<IrSegment>, TypesVisitor<IrSegment> {
    static constStrI: number = 0;
    static regI: number = 0;
    scopes: Map<string, string>[] = []; // sourceName -> compiledName
    globals: string[] = ["declare i32 @printf(i8*, ...)\n"];
    code: string = "";
    constructor(private readonly error: CompilerErrorHandler) {
        this.error = error;
    }

    compileProgram(nodes: Stmt[]): string {
        this.beginScope();
        this.scopes[this.scopes.length - 1].set("printf", "@printf");
        for (const stmt of nodes) {
            this.code += this.compileStmt(stmt);
        }
        for (const global of this.globals.reverse()) {
            this.code = global + this.code;
        }
        this.endScope();
        return this.code;
    }

    compileStmt(stmt: Stmt): string {
        return stmt.accept(this);
    }
    visitBlockStmt(stmt: BlockStmt): string {
        this.beginScope();
        let code = "";
        for (const statement of stmt.statements) {
            code += statement.accept(this);
        }
        this.endScope();
        return code;
    }
    visitVarStmt(stmt: VarStmt): IrSegment {
        const varName = stmt.name.lexeme;
        const varType = stmt.type.accept(this);
        let ir_code = "";
        const [ir, reg] = stmt.initializer?.accept(this) ?? ["", "zeroinitializer"];
        if (ir) {
            ir_code += ir;
        }
        let c_varName = `%${varName}`;
        if (this.scopes.length > 1) {
            const scope = this.scopes[this.scopes.length - 1];
            scope.set(varName, c_varName);
            ir_code += `${c_varName} = alloca ${varType}\n`;
            const valueType = stmt.initializer?.type.accept(this) ?? null;
            if (reg != "zeroinitializer") {
                const [turn_ir, turn_reg] = this.matchingTargetType(varType, valueType ?? "", reg);
                ir_code += turn_ir;
                ir_code += `store ${varType} ${turn_reg}, ${varType}* ${c_varName}\n`;
            }
        } else {
            c_varName = `@.${varName}`;
            const scope = this.scopes[this.scopes.length - 1];
            scope.set(varName, c_varName);
            ir_code = `${c_varName} = global ${varType} ${reg}\n`;
        }

        return ir_code;
    }
    visitFunctionStmt(stmt: FunctionStmt): IrSegment {
        this.beginScope();
        Compiler.regI = 0;
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
    visitExpressionStmt(stmt: ExpressionStmt): IrSegment {
        const [ir, reg] = stmt.expression.accept(this);
        return ir;
    }
    visitIfStmt(stmt: IfStmt): IrSegment {
        throw new Error("Method not implemented.");
    }
    visitWhileStmt(stmt: WhileStmt): IrSegment {
        throw new Error("Method not implemented.");
    }
    visitForStmt(stmt: ForStmt): IrSegment {
        throw new Error("Method not implemented.");
    }
    visitBreakStmt(stmt: BreakStmt): IrSegment {
        throw new Error("Method not implemented.");
    }
    visitContinueStmt(stmt: ContinueStmt): IrSegment {
        throw new Error("Method not implemented.");
    }
    visitReturnStmt(stmt: ReturnStmt): IrSegment {
        throw new Error("Method not implemented.");
    }
    visitClassStmt(stmt: ClassStmt): IrSegment {
        throw new Error("Method not implemented.");
    }


    // Expr

    visitAssignExpr(expr: AssignExpr): [IrSegment, Reg] {
        const type = expr.type.accept(this);

        const c_varName = this.findCompiledVarName(expr.name.lexeme);
        let ir_code = "";
        const [ir, valueReg] = expr.value.accept(this);
        ir_code += ir;
        ir_code += `store ${type} ${valueReg}, ${type}* ${c_varName}\n`;
        return [ir_code, valueReg];
    }
    visitConditionalExpr(expr: ConditionalExpr): [IrSegment, Reg] {
        throw new Error("Method not implemented.");
        // return `${expr.condition.accept(this)} ? ${expr.trueExpr.accept(this)} : ${expr.falseExpr.accept(this)}`;
    }
    visitLogicalExpr(expr: LogicalExpr): [IrSegment, Reg] {
        throw new Error("Method not implemented.");
    }
    visitBinaryExpr(expr: BinaryExpr): [IrSegment, Reg] {
        const [left_ir, leftReg] = expr.left.accept(this);
        const [right_ir, rightReg] = expr.right.accept(this);
        let ir_code = left_ir + right_ir;

        const type = expr.type.accept(this);
        const resultReg = `%bin_reg_${Compiler.regI++}`;
        switch (expr.operator.type) {
            case TokenType.Plus:
                ir_code += `${resultReg} = add ${type} ${leftReg}, ${rightReg}\n`;
                break;
            case TokenType.Minus:
                ir_code += `${resultReg} = sub ${type} ${leftReg}, ${rightReg}\n`;
                break;
            case TokenType.Star:
                ir_code += `${resultReg} = mul ${type} ${leftReg}, ${rightReg}\n`;
                break;
            case TokenType.Slash:
                //有符号除法
                ir_code += `${resultReg} = sdiv ${type} ${leftReg}, ${rightReg}\n`;
                break;
        }
        return [ir_code, resultReg];
    }
    visitUnaryExpr(expr: UnaryExpr): [IrSegment, Reg] {
        const [ir, reg] = expr.right.accept(this);
        let ir_code = ir;
        const type = expr.type.accept(this);
        const resultReg = `%unary_reg_${Compiler.regI++}`;
        const floatPoint = ["float", "double"];
        switch (expr.operator.type) {
            case TokenType.Minus:
                // 在 LLVM IR 中，整数取反使用 sub 指令：sub i32 0, %value
                if (floatPoint.includes(type)) {
                    ir_code += `${resultReg} = fneg ${type} ${reg}\n`;
                } else {
                    ir_code += `${resultReg} = sub ${type} 0, ${reg}\n`;
                }
                break;
        }
        return [ir_code, resultReg];
    }
    visitLiteralExpr(expr: LiteralExpr): [IrSegment, Reg] {
        const globalReg = `@.constant_${Compiler.constStrI++}`
        if (typeof expr.value === "string") {
            // private unnamed_addr constant [15 x i8] c"Hello, World!\0A\00", align 1
            const g_ir = `${globalReg} = private unnamed_addr constant [${expr.value.length + 2} x i8] c"${expr.value}\\0A\\00" align 1\n`;
            this.globals.push(g_ir);
            return ["", globalReg];
        }
        return ["", expr.value?.toString() ?? ""]
    }
    visitPostfixExpr(expr: PostfixExpr): [IrSegment, Reg] {
        throw new Error("Method not implemented.");
    }
    visitCallExpr(expr: CallExpr): [IrSegment, Reg] {
        const reg = `%call_reg_${Compiler.regI++}`;
        const calleeType = expr.callee.type.accept(this);
        const args = expr.arguments.map(argument => argument.accept(this));
        const argsRegs: Reg[] = [];
        let ir_code = "";
        args.forEach(arg => {
            if (arg[0]) {
                ir_code += arg[0];
            }
            if (arg[1]) {
                argsRegs.push(arg[1]);
            }
        });

        const [code, callee] = expr.callee.accept(this);
        if (code) {
            ir_code += code;
        }
        const paramTypes = expr.arguments.map(argument => argument.type.accept(this));

        ir_code += `call ${calleeType} ${callee}(${argsRegs.map((arg, index) => `${paramTypes[index]} ${arg}`).join(", ")})\n`;
        return [ir_code, reg];
    }
    visitSetExpr(expr: SetExpr): [IrSegment, Reg] {
        throw new Error("Method not implemented.");
    }
    visitGetExpr(expr: GetExpr): [IrSegment, Reg] {
        throw new Error("Method not implemented.");
    }
    visitThisExpr(expr: ThisExpr): [IrSegment, Reg] {
        throw new Error("Method not implemented.");
    }
    visitGroupingExpr(expr: GroupingExpr): [IrSegment, Reg] {
        throw new Error("Method not implemented.");
    }
    visitVariableExpr(expr: VariableExpr): [IrSegment, Reg] {
        const reg = `%val_reg_${Compiler.regI++}`;
        const type = expr.type.accept(this);
        const c_varName = this.findCompiledVarName(expr.name.lexeme);
        if (expr.type instanceof FunctionType) {
            const ir_code = `${reg} = bitcast ${type}* ${c_varName} to ${type}*\n`;
            return [ir_code, reg];
        }
        const ir_code = `${reg} = load ${type} , ${type}* ${c_varName}\n`;
        return [ir_code, reg];
    }


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


    beginScope(): void {
        this.scopes.push(new Map<string, string>());
    }
    endScope(): void {
        this.scopes.pop();
    }

    findCompiledVarName(sourceName: string): string {
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            const scope = this.scopes[i];
            const compiledName = scope.get(sourceName);
            if (compiledName) {
                return compiledName;
            }
        }
        throw new Error(`Variable ${sourceName} not found`);
    }

    matchingTargetType(targetType: string, sourceType: string, reg: Reg): [IrSegment, Reg] {
        const floatPoint = ["i8", "i16", "i32", "i64", "float", "double"];
        const targetI = floatPoint.indexOf(targetType);
        const sourceI = floatPoint.indexOf(sourceType);
        const turnReg = `%turn_reg_${Compiler.regI++}`;
        if (targetI == sourceI) {
            return ["", reg];
        } else if (targetI < sourceI) { //降级
            if (targetI < 4) {
                if (sourceI < 4) {//整数间转换
                    return [`${turnReg} = trunc ${sourceType} ${reg} to ${targetType}\n`, turnReg];
                } else { //浮点数转整数
                    return [`${turnReg} = fptosi ${sourceType} ${reg} to ${targetType}\n`, turnReg];
                }
            } else {
                return [`${turnReg} = fptrunc ${sourceType} ${reg} to ${targetType}\n`, turnReg];
            }
        } else { //升级
            if (targetI > 3) {
                if (sourceI > 3) {//浮点数间转换
                    return [`${turnReg} = fpext ${sourceType} ${reg} to ${targetType}\n`, turnReg];
                } else { //整数转浮点数
                    return [`${turnReg} = sitofp ${sourceType} ${reg} to ${targetType}\n`, turnReg];
                }
            } else {
                return [`${turnReg} = sext ${sourceType} ${reg} to ${targetType}\n`, turnReg];
            }
        }
    }
}