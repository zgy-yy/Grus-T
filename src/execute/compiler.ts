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

    loopStack: {
        continueBb: llvm.BasicBlock,
        breakBb: llvm.BasicBlock,
    }[] = [];
    labelMap: Map<string, llvm.BasicBlock> = new Map<string, llvm.BasicBlock>();
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
        bool: llvm.Type,
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
            bool: llvm.Type.getInt1Ty(this.context),
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

        // ========== 第一遍编译：声明所有函数 ==========
        // 目的：创建所有函数的签名（函数类型和名称），但不编译函数体
        // 这样即使函数定义在使用之后，也能正确编译
        for (const stmt of stmts) {
            if (stmt instanceof FunctionStmt) {
                this.declareFunction(stmt);
            }
        }

        // ========== 第二遍编译：编译所有语句 ==========
        // 目的：编译所有语句，包括函数体、变量声明、表达式等
        for (const stmt of stmts) {
            this.compileStmt(stmt);
        }
        const code = this.module.print();
        return code;
    }

    compileStmt(stmt: Stmt): void {
        return stmt.accept(this);
    }

    /**
     * 第一遍编译：声明函数（只创建函数签名，不编译函数体）
     * 用于支持函数声明在后面的情况
     * 
     * 工作原理：
     * 1. 检查函数是否已经声明过，如果已声明则跳过
     * 2. 创建函数类型（返回类型 + 参数类型）
     * 3. 创建函数对象并添加到模块中
     * 4. 将函数添加到作用域中，供后续调用使用
     */
    private declareFunction(stmt: FunctionStmt): void {
        const funName = stmt.fn.name.lexeme;
        // 如果函数已经声明过，跳过
        if (this.currentScope.has(funName)) {
            return;
        }

        const retType = this.llvmType(stmt.returnType);
        const paramTypes = stmt.parameters.map(param => this.llvmType(param.type));
        const funcType = llvm.FunctionType.get(retType, paramTypes, false);
        const func = llvm.Function.Create(funcType, llvm.Function.LinkageTypes.ExternalLinkage, funName, this.module);
        this.define(funName, func);
    }



    // StmtVisitor methods
    visitBlockStmt(stmt: BlockStmt): void {
        for (const s of stmt.statements) {
            this.compileStmt(s);
        }
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
        const funName = stmt.fn.name.lexeme;
        const retType = this.llvmType(stmt.returnType);
        this.currentFunction = {
            returnType: retType,
        };
        // 第二遍编译：获取已声明的函数（在第一遍中已创建）
        let func = this.currentScope.get(funName) as llvm.Function;

        // 创建函数的基本块并编译函数体
        const bb = llvm.BasicBlock.Create(this.context, 'entry', func);
        this.builder.SetInsertPoint(bb);

        // 处理函数参数：为每个参数创建 alloca，并从函数参数中加载值存储到 alloca
        for (let i = 0; i < stmt.parameters.length; i++) {
            const param = stmt.parameters[i];
            const paramType = this.llvmType(param.type);
            const paramAlloca = this.builder.CreateAlloca(paramType, null, param.name.lexeme);

            // 从函数参数中获取值（函数参数是 Value，不是指针）
            const funcArg = func.getArg(i);
            if (funcArg) {
                // 将函数参数的值存储到 alloca
                this.builder.CreateStore(funcArg, paramAlloca);
            }
            // 将 alloca 存储到作用域中，供后续使用
            this.define(param.name.lexeme, paramAlloca);
        }

        // 编译函数体
        for (const bodyStmt of stmt.body) {
            this.compileStmt(bodyStmt);
        }

        // 检查函数的基本块是否已经有终止指令
        const currentBb = this.builder.GetInsertBlock();
        if (currentBb && !this.hasRetTerminator(currentBb)) {
            // 如果没有终止指令，根据返回类型添加默认返回
            if (retType === this.constantTypes.void) {
                this.builder.CreateRetVoid();
            } else {
                // 非 void 函数如果没有 return 语句，标记为不可达
                this.builder.CreateUnreachable();
            }
        }
    }
    visitExpressionStmt(stmt: ExpressionStmt): void {
        stmt.expression.accept(this);
    }
    visitIfStmt(stmt: IfStmt): void {
        const insertBlock = this.builder.GetInsertBlock();
        if (!insertBlock) {
            throw new Error("No insert block found");
        }
        const parentFunc = insertBlock.getParent();
        if (!parentFunc) {
            throw new Error("No parent function found");
        }
        const condition = stmt.condition.accept(this);
        const thenBb = llvm.BasicBlock.Create(this.context, 'then', parentFunc);
        const elseBb = llvm.BasicBlock.Create(this.context, 'else', parentFunc);
        const mergeBb = llvm.BasicBlock.Create(this.context, 'merge', parentFunc);
        this.builder.CreateCondBr(condition, thenBb, elseBb);
        this.builder.SetInsertPoint(thenBb);
        this.compileStmt(stmt.thenBranch);
        if (!this.hasRetTerminator(thenBb)) {
            this.builder.CreateBr(mergeBb);
        }

        this.builder.SetInsertPoint(elseBb);
        if (stmt.elseBranch) {
            this.compileStmt(stmt.elseBranch);
        }
        if (!this.hasRetTerminator(elseBb)) {
            this.builder.CreateBr(mergeBb);
        }
        this.builder.SetInsertPoint(mergeBb);
    }
    visitWhileStmt(stmt: WhileStmt): void {
        const insertBlock = this.builder.GetInsertBlock();
        if (!insertBlock) {
            throw new Error("No insert block found");
        }
        const parentFunc = insertBlock.getParent();
        if (!parentFunc) {
            throw new Error("No parent function found");
        }
        // 创建基本块
        const condBb = llvm.BasicBlock.Create(this.context, 'while.cond', parentFunc);
        const bodyBb = llvm.BasicBlock.Create(this.context, 'while.body', parentFunc);
        const endBb = llvm.BasicBlock.Create(this.context, 'while.end', parentFunc);
        this.loopStack.push({
            continueBb: condBb,
            breakBb: endBb,
        });
        // 从 entry 块跳转到条件块
        this.builder.CreateBr(condBb);
        this.builder.SetInsertPoint(condBb);
        const condition = stmt.condition.accept(this);
        this.builder.CreateCondBr(condition, bodyBb, endBb);
        // 进入循环体
        this.builder.SetInsertPoint(bodyBb);
        this.compileStmt(stmt.body);
        this.builder.CreateBr(condBb);
        // 从循环体跳转到条件块
        this.builder.SetInsertPoint(endBb);
        this.loopStack.pop();
    }
    visitForStmt(stmt: ForStmt): void {
        const parentFunc = this.findParentFunction();
        //创建基本块
        const condBb = llvm.BasicBlock.Create(this.context, 'for.cond', parentFunc);
        const bodyBb = llvm.BasicBlock.Create(this.context, 'for.body', parentFunc);
        const incBb = llvm.BasicBlock.Create(this.context, 'for.inc', parentFunc);
        const endBb = llvm.BasicBlock.Create(this.context, 'for.end', parentFunc);
        this.loopStack.push({
            continueBb: incBb,
            breakBb: endBb,
        });

        // 编译初始化语句（在 entry 块中）
        if (stmt.initializer) {
            this.compileStmt(stmt.initializer);
        }
        // 从 entry 块跳转到条件块
        this.builder.CreateBr(condBb);
        // 进入条件块
        this.builder.SetInsertPoint(condBb);
        const condition = stmt.condition.accept(this);
        this.builder.CreateCondBr(condition, bodyBb, endBb);
        // 进入循环体
        this.builder.SetInsertPoint(bodyBb);
        this.compileStmt(stmt.body);
        this.builder.CreateBr(incBb);
        // 进入增量块
        this.builder.SetInsertPoint(incBb);
        if (stmt.increment) {
            stmt.increment.accept(this);
        }
        // 增量块总是跳转回条件块
        this.builder.CreateBr(condBb);
        // 进入结束块
        this.builder.SetInsertPoint(endBb);
        this.loopStack.pop();
    }
    visitDoWhileStmt(stmt: DoWhileStmt): void {
        const parentFunc = this.findParentFunction();

        // 创建基本块
        const condBb = llvm.BasicBlock.Create(this.context, 'do.cond', parentFunc);
        const bodyBb = llvm.BasicBlock.Create(this.context, 'do.body', parentFunc);
        const endBb = llvm.BasicBlock.Create(this.context, 'do.end', parentFunc);
        this.loopStack.push({
            continueBb: condBb,
            breakBb: endBb,
        });
        // 从 entry 块跳转到body
        this.builder.CreateBr(bodyBb);
        this.builder.SetInsertPoint(bodyBb);
        this.compileStmt(stmt.body);
        this.builder.CreateBr(condBb);
        // 从body跳转到条件块
        this.builder.SetInsertPoint(condBb);
        const condition = stmt.condition.accept(this);
        this.builder.CreateCondBr(condition, bodyBb, endBb);
        // 从条件块跳转到结束块
        this.builder.SetInsertPoint(endBb);
        this.loopStack.pop();
    }
    visitLoopStmt(stmt: LoopStmt): void {
        const parentFunc = this.findParentFunction();
        //创建基本块
        const loopBb = llvm.BasicBlock.Create(this.context, 'loop.body', parentFunc);
        const endBb = llvm.BasicBlock.Create(this.context, 'loop.end', parentFunc);
        this.loopStack.push({
            continueBb: loopBb,
            breakBb: endBb,
        });
        this.builder.CreateBr(loopBb);
        //进入循环体
        this.builder.SetInsertPoint(loopBb);
        this.compileStmt(stmt.body);
        this.builder.CreateBr(loopBb);
        //进入结束块
        this.builder.SetInsertPoint(endBb);
        this.loopStack.pop();
    }
    visitBreakStmt(stmt: BreakStmt): void {
        const breakBb = this.loopStack[this.loopStack.length - 1].breakBb;
        this.builder.CreateBr(breakBb);
        const parentFunc = this.findParentFunction();
        const deleteBb = llvm.BasicBlock.Create(this.context, 'delete', parentFunc);
        this.builder.SetInsertPoint(deleteBb);
    }
    visitContinueStmt(stmt: ContinueStmt): void {
        const continueBb = this.loopStack[this.loopStack.length - 1].continueBb;
        this.builder.CreateBr(continueBb);
        const parentFunc = this.findParentFunction();
        const deleteBb = llvm.BasicBlock.Create(this.context, 'delete', parentFunc);
        this.builder.SetInsertPoint(deleteBb);

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
        const labelBb = this.getLabelBlock(stmt.label.lexeme);
        this.builder.CreateBr(labelBb);
        this.builder.SetInsertPoint(labelBb);
        if (stmt.body) {
            this.compileStmt(stmt.body);
        }
    }
    visitGotoStmt(stmt: GotoStmt): void {
        const targetBb = this.getLabelBlock(stmt.label.lexeme);
        this.builder.CreateBr(targetBb);
        const parentFunc = this.findParentFunction();
        const deleteBb = llvm.BasicBlock.Create(this.context, 'delete', parentFunc);
        this.builder.SetInsertPoint(deleteBb);
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
        const parentFunc = this.findParentFunction();
        switch (expr.operator.type) {
            case TokenType.And:
                {
                    const rhsBb = llvm.BasicBlock.Create(this.context, 'and.rhs', parentFunc);
                    const mergeBb = llvm.BasicBlock.Create(this.context, 'and.merge', parentFunc);
                    const leftValue = expr.left.accept(this);
                    const startBb = this.builder.GetInsertBlock();
                    //短路跳转，真值跳转到rhsBb，假值跳转到mergeBb
                    this.builder.CreateCondBr(leftValue, rhsBb, mergeBb);
                    //填充rhsBb
                    this.builder.SetInsertPoint(rhsBb);
                    const rightValue = expr.right.accept(this);
                    const rhsActualBb = this.builder.GetInsertBlock();
                    this.builder.CreateBr(mergeBb);
                    //填充mergeBb，合并lhs和rhs的值
                    this.builder.SetInsertPoint(mergeBb);
                    const phi = this.builder.CreatePHI(this.builder.getInt1Ty(), 2, "and_res");
                    phi.addIncoming(this.builder.getInt1(false), startBb!); // 来自 LHS 的假
                    phi.addIncoming(rightValue, rhsActualBb!);                 // 来自 RHS 的结果
                    return phi;
                }
            case TokenType.Or:
                {
                    const rhsBb = llvm.BasicBlock.Create(this.context, 'or.rhs', parentFunc);
                    const mergeBb = llvm.BasicBlock.Create(this.context, 'or.merge', parentFunc);
                    const leftValue = expr.left.accept(this);
                    const startBb = this.builder.GetInsertBlock();
                    //短路跳转，真值跳转到mergeBb,假值跳转到rhsBb
                    this.builder.CreateCondBr(leftValue, mergeBb, rhsBb);
                    //填充rhsBb
                    this.builder.SetInsertPoint(rhsBb);
                    const rightValue = expr.right.accept(this);
                    const rhsActualBb = this.builder.GetInsertBlock();
                    this.builder.CreateBr(mergeBb);
                    //填充mergeBb，合并lhs和rhs的值
                    this.builder.SetInsertPoint(mergeBb);
                    const phi = this.builder.CreatePHI(this.builder.getInt1Ty(), 2, "or_res");
                    phi.addIncoming(leftValue, startBb!); // 来自 LHS 的结果
                    phi.addIncoming(rightValue, rhsActualBb!);                 // 来自 RHS 的结果
                    return phi;
                }
        }



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
                case TokenType.EqualEqual:
                    return this.builder.CreateFCmpOEQ(left, right);
                case TokenType.BangEqual:
                    return this.builder.CreateFCmpUNE(left, right);
                case TokenType.Greater:
                    return this.builder.CreateFCmpOGT(left, right);
                case TokenType.GreaterEqual:
                    return this.builder.CreateFCmpOGE(left, right);
                case TokenType.Less:
                    return this.builder.CreateFCmpOLT(left, right);
                case TokenType.LessEqual:
                    return this.builder.CreateFCmpOLE(left, right);
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
                case TokenType.EqualEqual:
                    return this.builder.CreateICmpEQ(left, right);
                case TokenType.BangEqual:
                    return this.builder.CreateICmpNE(left, right);
                case TokenType.BitAnd:
                    return this.builder.CreateAnd(left, right);
                case TokenType.BitOr:
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
            case TokenType.Tilde:
                return this.builder.CreateNot(expr.right.accept(this));
            case TokenType.Bang:
                return this.builder.CreateNot(expr.right.accept(this));
        }
        throw new Error(`Unsupported unary operator: ${operator.type}`);
    }
    visitLiteralExpr(expr: LiteralExpr): llvm.Value {
        switch (expr.literalType) {
            case 'string':
                return this.builder.CreateGlobalStringPtr(expr.value);
            case 'bool':
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
        this.isLieft = true;
        const target = expr.target.accept(this);
        this.isLieft = false;
        let oldValue = expr.target.accept(this);
        switch (expr.operator.type) {
            case TokenType.PlusPlus:
                {
                    const newValue = this.builder.CreateAdd(oldValue, this.builder.getInt32(1));
                    this.builder.CreateStore(newValue, target);
                    return oldValue;
                }
            case TokenType.MinusMinus:
                {
                    const newValue = this.builder.CreateSub(oldValue, this.builder.getInt32(1));
                    this.builder.CreateStore(newValue, target);
                    return oldValue;
                }
                break;
        }
        throw new Error(`Unsupported postfix operator: ${expr.operator.type}`);
    }
    visitPrefixExpr(expr: PrefixExpr): llvm.Value {
        this.isLieft = true;
        const target = expr.target.accept(this);
        this.isLieft = false;
        let oldValue = expr.target.accept(this);
        switch (expr.operator.type) {
            case TokenType.PlusPlus:
                {
                    const newValue = this.builder.CreateAdd(oldValue, this.builder.getInt32(1));
                    this.builder.CreateStore(newValue, target);
                    return newValue;
                }
                break;
            case TokenType.MinusMinus:
                {
                    const newValue = this.builder.CreateSub(oldValue, this.builder.getInt32(1));
                    this.builder.CreateStore(newValue, target);
                    return newValue;
                }
                break;
        }
        throw new Error(`Unsupported prefix operator: ${expr.operator.type}`);
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
            if (variable) {
                return variable
            } else {
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
        this.scopes.push(new Map<string, llvm.Value>());
        this.currentScope = this.scopes[this.scopes.length - 1];
    }
    endScope(): void {
        this.scopes.pop();
        this.currentScope = this.scopes[this.scopes.length - 1];
    }

    define(name: string, val: llvm.Value): void {
        this.currentScope.set(name, val);
    }

    getLabelBlock(labelName: string): llvm.BasicBlock {
        const insertBlock = this.builder.GetInsertBlock();
        if (!insertBlock) {
            throw new Error("No insert block found");
        }
        const parentFunc = insertBlock.getParent();
        if (!parentFunc) {
            throw new Error("No parent function found");
        }
        if (this.labelMap.has(labelName)) {
            return this.labelMap.get(labelName)!;
        }
        const labelBlock = llvm.BasicBlock.Create(this.context, `label.${labelName}`, parentFunc);
        this.labelMap.set(labelName, labelBlock);
        return labelBlock;
    }
    private findParentFunction(): llvm.Function {
        const insertBlock = this.builder.GetInsertBlock();
        if (!insertBlock) {
            throw new Error("No insert block found");
        }
        const parentFunc = insertBlock.getParent();
        if (!parentFunc) {
            throw new Error("No parent function found");
        }
        return parentFunc;
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

        if (leftBitWidth == 0) {//左边是float或double
            right = this.builder.CreateSIToFP(right, leftType);
        } else if (rightBitWidth == 0) {//右边是float或double
            left = this.builder.CreateSIToFP(left, rightType);
        } else if (leftBitWidth < rightBitWidth) {
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
        if (type.isIntegerTy(1)) {
            return 1;
        }
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

    /**
     * 检查基本块是否已经有终止指令（terminator）
     */
    private hasRetTerminator(bb: llvm.BasicBlock): boolean {
        const terminator = bb.getTerminator();
        return terminator instanceof llvm.ReturnInst;
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
                case 'bool':
                    return this.constantTypes.bool;
            }
        }

        throw new Error(`Unsupported type: ${type}`);
    }

}
