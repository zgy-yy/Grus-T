import { AssignExpr, BinaryExpr, CallExpr, CastExpr, ConditionalExpr, ExprVisitor, GetExpr, LambdaExpr, LiteralExpr, LogicalExpr, PostfixExpr, PrefixExpr, SetExpr, ThisExpr, UnaryExpr, VariableExpr } from "@/ast/Expr";
import { BlockStmt, BreakStmt, ClassStmt, ContinueStmt, DoWhileStmt, ExpressionStmt, ForStmt, FunctionStmt, GotoStmt, IfStmt, LabelStmt, LoopStmt, ReturnStmt, StmtVisitor, VarStmt, WhileStmt } from "@/ast/Stmt";
import { Stmt } from "@/ast/Stmt";
import { CompilerErrorHandler } from "@/parser/ErrorHandler";
import { Token } from "@/ast/Token";
import llvm from "llvm-bindings";
import { GrusType, SimpleType } from "@/ast/GrusTypes";
import { TokenType } from "@/ast/TokenType";

export class CompilerError extends Error {
    public token: Token;
    constructor(token: Token, message: string) {
        super(message);
        this.token = token;
    }
}


export class Compiler implements ExprVisitor<llvm.Value>, StmtVisitor<void> {

    LoopStack: {
        startLabel: string,
        endLabel: string,
    }[] = [];
    scopes: Map<string, llvm.Value>[] = []; // sourceName -> compiledName
    currentScope: Map<string, llvm.Value> = new Map<string, llvm.Value>();
    currentFunction: {
        returnType: llvm.Type,
    }
    isLieft: boolean = false; //当前是否是左值，左值时取地址



    context: llvm.LLVMContext;
    module: llvm.Module;
    builder: llvm.IRBuilder;
    constantTypes: {
        void: llvm.Type,
        i8: llvm.Type,
        i16: llvm.Type,
        i32: llvm.Type,
        i64: llvm.Type,
        float: llvm.Type,
        double: llvm.Type,
    }

    constructor(private readonly errorHandler: CompilerErrorHandler) {
        this.context = new llvm.LLVMContext();
        this.module = new llvm.Module('demo_module', this.context);
        this.builder = new llvm.IRBuilder(this.context);
        this.constantTypes = {
            void: llvm.Type.getVoidTy(this.context),
            i8: llvm.Type.getInt8Ty(this.context),
            i16: llvm.Type.getInt16Ty(this.context),
            i32: llvm.Type.getInt32Ty(this.context),
            i64: llvm.Type.getInt64Ty(this.context),
            float: llvm.Type.getFloatTy(this.context),
            double: llvm.Type.getDoubleTy(this.context),
        };

        this.currentFunction = {
            returnType: llvm.Type.getVoidTy(this.context),
        };

    }

    compileProgram(stmts: Stmt[]): string {
        this.beginScope();
        //默认声明printf
        const i32Type = llvm.Type.getInt32Ty(this.context);
        const i8PtrTy = llvm.Type.getInt8PtrTy(this.context);
        const printfType = llvm.FunctionType.get(i32Type, [i8PtrTy], true);
        const printf = llvm.Function.Create(printfType, llvm.Function.LinkageTypes.ExternalLinkage, "printf", this.module);

        this.currentScope.set("printf", printf);
        for (const stmt of stmts) {
            this.compileStmt(stmt);
        }
        const code = this.module.print();
        return code;
    }

    compileStmt(stmt: Stmt): void {
        return stmt.accept(this);
    }



    // StmtVisitor methods
    visitBlockStmt(stmt: BlockStmt): void {
        throw new Error("Method not implemented.");
    }
    visitVarStmt(stmt: VarStmt): void {
        for (const variable of stmt.vars) {
            const varType = this.llvmType(variable.type);
            const varName = variable.name.lexeme;
            const varAlloca = this.builder.CreateAlloca(varType, null, varName);
            this.define(varName, varAlloca);
            if (variable.defaultValue) {
                let defaultValue = variable.defaultValue.accept(this);
                defaultValue = this.promoteType(defaultValue, varType);
                this.builder.CreateStore(defaultValue, varAlloca);
            }
        }
    }
    visitFunctionStmt(stmt: FunctionStmt): void {
        const retType = this.llvmType(stmt.returnType);
        this.currentFunction = {
            returnType: retType,
        };
        const paramTypes = stmt.parameters.map(param => this.llvmType(param.type));
        const funcType = llvm.FunctionType.get(retType, paramTypes, false);
        const func = llvm.Function.Create(funcType, llvm.Function.LinkageTypes.ExternalLinkage, stmt.name.lexeme, this.module);
        const bb = llvm.BasicBlock.Create(this.context, 'entry', func);
        this.builder.SetInsertPoint(bb);
        // for (const param of stmt.parameters) {
        //     const paramValue = this.builder.CreateAlloca(this.llvmType(param.type));
        //     this.builder.CreateStore(paramValue, paramValue);
        // }
        for (const bodyStmt of stmt.body) {
            this.compileStmt(bodyStmt);
        }
    }
    visitExpressionStmt(stmt: ExpressionStmt): void {
        stmt.expression.accept(this);
    }
    visitIfStmt(stmt: IfStmt): void {
        throw new Error("Method not implemented.");
    }
    visitWhileStmt(stmt: WhileStmt): void {
        throw new Error("Method not implemented.");
    }
    visitForStmt(stmt: ForStmt): void {
        throw new Error("Method not implemented.");
    }
    visitDoWhileStmt(stmt: DoWhileStmt): void {
        throw new Error("Method not implemented.");
    }
    visitLoopStmt(stmt: LoopStmt): void {
        throw new Error("Method not implemented.");
    }
    visitBreakStmt(stmt: BreakStmt): void {
        throw new Error("Method not implemented.");
    }
    visitContinueStmt(stmt: ContinueStmt): void {
        throw new Error("Method not implemented.");
    }
    visitReturnStmt(stmt: ReturnStmt): void {
        if (stmt.value) {
            let value = stmt.value.accept(this);
            value = this.promoteType(value, this.currentFunction.returnType);
            this.builder.CreateRet(value);

        } else {
            this.builder.CreateRetVoid();
        }
    }
    visitClassStmt(stmt: ClassStmt): void {
        throw new Error("Method not implemented.");
    }
    visitLabelStmt(stmt: LabelStmt): void {
        throw new Error("Method not implemented.");
    }
    visitGotoStmt(stmt: GotoStmt): void {
        throw new Error("Method not implemented.");
    }

    // ExprVisitor methods
    visitAssignExpr(expr: AssignExpr): llvm.Value {
        this.isLieft = true;
        const left = expr.target.accept(this);
        this.isLieft = false;
        // 获取 left 的原始类型（变量的声明类型）
        let targetType: llvm.Type;
        if (left instanceof llvm.AllocaInst) {
            // 如果是 alloca，获取其分配的类型（原始类型）
            targetType = left.getAllocatedType();
        } else {
            // 如果不是 alloca，使用其类型
            targetType = left.getType();
        }
        // 计算右值
        let rightValue = expr.value.accept(this);
        // 进行类型对齐：将右值转换为左值的原始类型
        rightValue = this.promoteType(rightValue, targetType);
        
        // 存储到左值
        this.builder.CreateStore(rightValue, left);

        // 返回右值（赋值表达式的值）
        return rightValue;
    }
    visitConditionalExpr(expr: ConditionalExpr): llvm.Value {
        throw new Error("Method not implemented.");
    }
    visitLogicalExpr(expr: LogicalExpr): llvm.Value {
        throw new Error("Method not implemented.");
    }

    visitBinaryExpr(expr: BinaryExpr): llvm.Value {
        let left = expr.left.accept(this);
        let right = expr.right.accept(this);

        // 进行类型对齐
        [left, right] = this.upgradeType(left, right);
        // 使用类型对象比较方式检查是否为浮点类型（避免方法调用丢失上下文）
        const leftType = left.getType();
        const rightType = right.getType();
        const isFloat = this.isFloatType(leftType) || this.isFloatType(rightType);
        if (isFloat) {
            switch (expr.operator.type) {
                case TokenType.Plus:
                    return this.builder.CreateFAdd(left, right);
                case TokenType.Minus:
                    return this.builder.CreateFSub(left, right);
                case TokenType.Star:
                    return this.builder.CreateFMul(left, right);
                case TokenType.Slash:
                    return this.builder.CreateFDiv(left, right);
                case TokenType.Percent:
                    return this.builder.CreateFRem(left, right);
            }
        } else {
            switch (expr.operator.type) {
                case TokenType.Plus:
                    return this.builder.CreateAdd(left, right);
                case TokenType.Minus:
                    return this.builder.CreateSub(left, right);
                case TokenType.Star:
                    return this.builder.CreateMul(left, right);
                case TokenType.Slash:
                    return this.builder.CreateSDiv(left, right);
                case TokenType.Percent:
                    return this.builder.CreateSRem(left, right);
                case TokenType.Less:
                    return this.builder.CreateICmpSLT(left, right);
                case TokenType.Greater:
                    return this.builder.CreateICmpSGT(left, right);
                case TokenType.LessEqual:
                    return this.builder.CreateICmpSLE(left, right);
                case TokenType.GreaterEqual:
                    return this.builder.CreateICmpSGE(left, right);
                case TokenType.Equal:
                    return this.builder.CreateICmpEQ(left, right);
                case TokenType.BangEqual:
                    return this.builder.CreateICmpNE(left, right);
                case TokenType.And:
                    return this.builder.CreateAnd(left, right);
                case TokenType.Or:
                    return this.builder.CreateOr(left, right);
                case TokenType.Caret:
                    return this.builder.CreateXor(left, right);
                case TokenType.LessLess:
                    return this.builder.CreateShl(left, right);
                case TokenType.GreaterGreater:
                    return this.builder.CreateAShr(left, right);
            }
        }
        throw new Error(`Unsupported binary operator: ${expr.operator.type}`);
    }
    visitUnaryExpr(expr: UnaryExpr): llvm.Value {
        const operator = expr.operator
        switch (operator.type) {
            case TokenType.Minus:
                const operand = expr.right.accept(this);
                const isFloat = this.isFloatType(operand.getType());
                if (isFloat) {
                    return this.builder.CreateFNeg(operand);
                } else {
                    return this.builder.CreateNeg(operand);
                }
            // case TokenType.Tilde:
            //     return this.builder.CreateNot(expr.right.accept(this));
            // case TokenType.Bang:
            //     return this.builder.CreateNot(expr.right.accept(this));
        }
        throw new Error(`Unsupported unary operator: ${operator.type}`);
    }
    visitLiteralExpr(expr: LiteralExpr): llvm.Value {
        switch (expr.literalType) {
            case 'string':
                return this.builder.CreateGlobalStringPtr(expr.value);
            case 'boolean':
                return this.builder.getInt1(expr.value === 'true' ? true : false);
            case 'i8':
                return this.builder.getInt8(Number(expr.value));
            case 'i16':
                return this.builder.getInt16(Number(expr.value));
            case 'i32':
                return this.builder.getInt32(Number(expr.value));
            case 'i64':
                return this.builder.getInt64(Number(expr.value));
            case 'float':
                const floatTy = llvm.Type.getFloatTy(this.context);
                return llvm.ConstantFP.get(floatTy, Number(expr.value));
            case 'double':
                const doubleTy = llvm.Type.getDoubleTy(this.context);
                return llvm.ConstantFP.get(doubleTy, Number(expr.value));
        }
        return this.builder.getInt32(0);
    }
    visitPostfixExpr(expr: PostfixExpr): llvm.Value {
        throw new Error("Method not implemented.");
    }
    visitPrefixExpr(expr: PrefixExpr): llvm.Value {
        throw new Error("Method not implemented.");
    }
    visitCallExpr(expr: CallExpr): llvm.Value {
        const callee = expr.callee.accept(this);
        const args = expr.arguments.map(arg => arg.accept(this));
        return this.builder.CreateCall(callee as llvm.Function, args);
    }
    visitSetExpr(expr: SetExpr): llvm.Value {
        throw new Error("Method not implemented.");
    }
    visitGetExpr(expr: GetExpr): llvm.Value {
        throw new Error("Method not implemented.");
    }
    visitThisExpr(expr: ThisExpr): llvm.Value {
        throw new Error("Method not implemented.");
    }
    visitVariableExpr(expr: VariableExpr): llvm.Value {
        const variable = this.currentScope.get(expr.name.lexeme);
        if (this.isLieft) {
           if(variable){
            return variable
           }else{
            throw new Error(`Variable ${expr.name.lexeme} not found`);
           }
        }
        if (variable instanceof llvm.AllocaInst) {
            return this.builder.CreateLoad(variable.getAllocatedType(), variable, expr.name.lexeme);
        }
        if (variable instanceof llvm.Function) {
            return variable;
        }
        throw new Error(`Variable ${expr.name.lexeme} not found`);
    }
    visitLambdaExpr(expr: LambdaExpr): llvm.Value {
        throw new Error("Method not implemented.");
    }
    visitCastExpr(expr: CastExpr): llvm.Value {
        const target = expr.target.accept(this);
        const targetType = this.llvmType(expr.type)
        return this.promoteType(target, targetType);
    }


    //作用域
    beginScope(): void {
        this.scopes.push(new Map<string, any>());
        this.currentScope = this.scopes[this.scopes.length - 1];
    }
    endScope(): void {
        this.scopes.pop();
        this.currentScope = this.scopes[this.scopes.length - 1];
    }

    define(name: string, val: llvm.Value): void {
        this.currentScope.set(name, val);
    }

    private upgradeType(left: llvm.Value, right: llvm.Value): [llvm.Value, llvm.Value] {
        const leftType = left.getType();
        const rightType = right.getType()
        const leftBitWidth = this.getIntegerBitWidth(leftType);
        const rightBitWidth = this.getIntegerBitWidth(rightType);
        // 如果类型相同，不需要转换
        if (leftBitWidth == rightBitWidth) {
            return [left, right];
        }
        if (leftBitWidth < rightBitWidth) {
            // 使用有符号扩展（SExt）而不是无符号扩展（ZExt）
            left = this.builder.CreateSExt(left, rightType);
        } else {
            // 使用有符号扩展（SExt）而不是无符号扩展（ZExt）
            right = this.builder.CreateSExt(right, leftType);
        }
        return [left, right];
    }
    private promoteType(value: llvm.Value, targetType: llvm.Type): llvm.Value {
        const valueType = value.getType();

        // 如果类型相同，不需要转换
        if (valueType === targetType) {
            return value;
        }

        const valueIsFloat = this.isFloatType(valueType);
        const targetIsFloat = this.isFloatType(targetType);

        // 情况1: 整数转浮点
        if (!valueIsFloat && targetIsFloat) {
            return this.builder.CreateSIToFP(value, targetType);
        }

        // 情况2: 浮点转整数
        if (valueIsFloat && !targetIsFloat) {
            return this.builder.CreateFPToSI(value, targetType);
        }

        // 情况3: 浮点精度转换
        if (valueIsFloat && targetIsFloat) {
            const valueBitWidth = this.getFloatBitWidth(valueType);
            const targetBitWidth = this.getFloatBitWidth(targetType);
            if (valueBitWidth < targetBitWidth) {
                // float -> double
                return this.builder.CreateFPExt(value, targetType);
            } else if (valueBitWidth > targetBitWidth) {
                // double -> float
                return this.builder.CreateFPTrunc(value, targetType);
            }
        }

        // 情况4: 整数大小转换
        if (!valueIsFloat && !targetIsFloat) {
            const valueBitWidth = this.getIntegerBitWidth(valueType);
            const targetBitWidth = this.getIntegerBitWidth(targetType);
            if (valueBitWidth < targetBitWidth) {
                // 使用有符号扩展（SExt）而不是无符号扩展（ZExt）
                return this.builder.CreateSExt(value, targetType);
            } else if (valueBitWidth > targetBitWidth) {
                // 截断
                return this.builder.CreateTrunc(value, targetType);
            }
        }

        return value;
    }

    private getFloatBitWidth(type: llvm.Type): number {
        if (type === this.constantTypes.float) return 32;
        if (type === this.constantTypes.double) return 64;
        return 0;
    }

    private getIntegerBitWidth(type: llvm.Type): number {
        if (type.isIntegerTy(8)) {
            return 8;
        } else if (type.isIntegerTy(16)) {
            return 16;
        } else if (type.isIntegerTy(32)) {
            return 32;
        } else if (type.isIntegerTy(64)) {
            return 64;
        }
        return 0;
    }
    private isFloatType(type: llvm.Type): boolean {
        const w = this.getIntegerBitWidth(type)
        if (w == 0) {
            return true;
        }
        return false
    }

    llvmType(type: GrusType): llvm.IntegerType {
        if (type instanceof SimpleType) {
            switch (type.typ) {
                case 'void':
                    return this.constantTypes.void;
                case 'i8':
                    return this.constantTypes.i8
                case 'i16':
                    return this.constantTypes.i16;
                case 'i32':
                    return this.constantTypes.i32;
                case 'i64':
                    return this.constantTypes.i64;
                case 'float':
                    return this.constantTypes.float;
                case 'double':
                    return this.constantTypes.double;
            }
        }

        throw new Error(`Unsupported type: ${type}`);
    }

}
