import { AssignExpr, BinaryExpr, CallExpr, CastExpr, ConditionalExpr, ExprVisitor, GetExpr, LambdaExpr, LiteralExpr, LogicalExpr, PostfixExpr, PrefixExpr, SetExpr, ThisExpr, UnaryExpr, VariableExpr } from "@/ast/Expr";
import { BlockStmt, BreakStmt, ClassStmt, ContinueStmt, DoWhileStmt, ExpressionStmt, ForStmt, FunctionStmt, GotoStmt, GSymbol, IfStmt, LabelStmt, LoopStmt, ReturnStmt, StmtVisitor, VarStmt, WhileStmt } from "@/ast/Stmt";
import { Stmt } from "@/ast/Stmt";
import { CompilerErrorHandler } from "@/parser/ErrorHandler";
import { Token } from "@/ast/Token";
import llvm from "@wangziwenhk/llvm-bindings";
import { FunctionType, GrusType, PointerType, SimpleType, TempOmittedType } from "@/ast/GrusTypes";
import { TokenType } from "@/ast/TokenType";

export class CompilerError extends Error {
    public token: Token;
    constructor(token: Token, message: string) {
        super(message);
        this.token = token;
    }
}


export class Compiler implements ExprVisitor<llvm.Value>, StmtVisitor<void> {

    private loopStack: {
        continueBb: llvm.BasicBlock,
        breakBb: llvm.BasicBlock,
    }[] = [];
    private labelMap: Map<string, llvm.BasicBlock> = new Map<string, llvm.BasicBlock>();
    private scopes: Map<string, {
        val: llvm.Value,
        type: GrusType,
    }>[] = []; // sourceName -> compiledName
    private currentScope: Map<string, {
        val: llvm.Value,
        type: GrusType,
    }> = new Map();
    private currentFunction: {
        returnType: llvm.Type,
    }
    private currentVar: {
        isLeft: boolean,
        lType: llvm.Type,
    }
    captured: Set<GSymbol> = new Set(); // 缓存捕获的变量
    currentClosure: {
        captured: GSymbol[],
        envType: llvm.Type,
    } | null = null;


    private context: llvm.LLVMContext;
    private module: llvm.Module;
    private builder: llvm.IRBuilder;
    private constantTypes: {
        void: llvm.Type,
        bool: llvm.Type,
        i8: llvm.Type,
        i16: llvm.Type,
        i32: llvm.Type,
        i64: llvm.Type,
        float: llvm.Type,
        double: llvm.Type,
        ptr: llvm.Type,
        closure: llvm.Type,
    }
    private mallocFunc: llvm.FunctionCallee;
    private fatFuncs: Map<llvm.Function, llvm.Value>;

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
            ptr: llvm.Type.getInt8PtrTy(this.context),
            closure: llvm.StructType.create(this.context,
                [
                    llvm.Type.getInt8PtrTy(this.context),
                    llvm.Type.getInt8PtrTy(this.context),
                ],
                "closure"
            ),
        };
        this.fatFuncs = new Map<llvm.Function, llvm.Value>();
        this.currentFunction = {
            returnType: llvm.Type.getVoidTy(this.context),
        };
        this.currentVar = {
            isLeft: false,
            lType: llvm.Type.getVoidTy(this.context),
        };
        const mallocType = llvm.FunctionType.get(this.constantTypes.ptr, [this.constantTypes.i32], false);
        this.mallocFunc = this.module.getOrInsertFunction('malloc', mallocType);

    }

    compileProgram(stmts: Stmt[]): string {
        this.beginScope();
        //默认声明printf
        const LType = llvm.FunctionType.get(this.constantTypes.i32, [this.constantTypes.ptr], true);
        const printf = llvm.Function.Create(LType, llvm.Function.LinkageTypes.ExternalLinkage, "printf", this.module);
        this.define("printf", printf, new FunctionType(new SimpleType("i32"), [new SimpleType("string"), new TempOmittedType()]));

        // ========== 第一遍编译：声明所有函数 ==========
        // 目的：创建所有函数的签名（函数类型和名称），但不编译函数体
        for (const stmt of stmts) {
            if (stmt instanceof FunctionStmt) {
                const funName = stmt.name.lexeme;
                const retLType = this.llvmType(stmt.returnType);
                const paramLTypes = stmt.parameters.map(param => this.llvmType(param.type));
                const func = this.declareFunction(funName, retLType, paramLTypes);
                this.define(funName, func, new FunctionType(stmt.returnType, stmt.parameters.map(param => param.type)));
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




    // StmtVisitor methods
    visitBlockStmt(stmt: BlockStmt): void {
        this.beginScope();
        for (const s of stmt.statements) {
            this.compileStmt(s);
        }
        this.endScope();
    }
    visitVarStmt(stmt: VarStmt): void {
        for (const variable of stmt.vars) {
            const varLType = this.llvmType(variable.type);
            const varName = variable.name.lexeme;
            let defaultValue = variable.defaultValue.accept(this);
            defaultValue = this.promoteType(defaultValue, varLType);
            if (this.captured.has(variable)) {
                const dataLayout = this.module.getDataLayout();
                const size = dataLayout.getTypeAllocSize(varLType);
                // 将大小转换为 LLVM 的 ConstantInt
                const sizeValue = llvm.ConstantInt.get(llvm.Type.getInt32Ty(this.context), size);
                const val = this.builder.CreateCall(this.mallocFunc, [sizeValue]);
                this.define(varName, val, variable.type);
                if (variable.defaultValue) {
                    this.builder.CreateStore(defaultValue, val);
                }
            } else {
                const val = this.builder.CreateAlloca(varLType, null, varName);
                this.define(varName, val, variable.type);
                if (variable.defaultValue) {
                    this.builder.CreateStore(defaultValue, val);
                }
            }

        }
    }
    visitFunctionStmt(stmt: FunctionStmt): void {
        const funName = stmt.name.lexeme;
        // 第二遍编译：获取已声明的函数（在第一遍中已创建）
        let func = this.currentScope.get(funName)?.val as llvm.Function;
        this.defineFunction(func, stmt.parameters, stmt.body, stmt.returnType);
        //生成胖函数
        const paramLTypes = stmt.parameters.map(param => this.llvmType(param.type));
        paramLTypes.unshift(llvm.PointerType.get(llvm.Type.getInt8PtrTy(this.context), 0));

        const retType = this.llvmType(stmt.returnType);
        const funcType = llvm.FunctionType.get(retType, paramLTypes, false);
        const wfunc = llvm.Function.Create(funcType, llvm.Function.LinkageTypes.ExternalLinkage, `${funName}_wrapper`, this.module);
        const bb = llvm.BasicBlock.Create(this.context, 'entry', wfunc);  // 修复：应该为 wfunc 创建基本块，而不是 func
        this.builder.SetInsertPoint(bb);
        const args = stmt.parameters.map((param, ind) => wfunc.getArg(ind + 1));
        const result = this.builder.CreateCall(func, args);
        if (stmt.returnType instanceof SimpleType && stmt.returnType.type === "void") {
            this.builder.CreateRetVoid();
        } else {
            this.builder.CreateRet(result);
        }
        this.fatFuncs.set(func, wfunc);

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
        this.beginScope();
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
        this.endScope();
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
        const deleteBb = llvm.BasicBlock.Create(this.context, 'break', parentFunc);
        this.builder.SetInsertPoint(deleteBb);
    }
    visitContinueStmt(stmt: ContinueStmt): void {
        const continueBb = this.loopStack[this.loopStack.length - 1].continueBb;
        this.builder.CreateBr(continueBb);
        const parentFunc = this.findParentFunction();
        const deleteBb = llvm.BasicBlock.Create(this.context, 'continue', parentFunc);
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
        this.currentVar.isLeft = true;
        const val = expr.target.accept(this);
        let targetType: llvm.Type = this.currentVar.lType;
        this.currentVar.isLeft = false;

        // 计算右值
        let rightValue = expr.value.accept(this);
        // 进行类型对齐：将右值转换为左值的原始类型
        rightValue = this.promoteType(rightValue, targetType);

        // 存储到左值
        this.builder.CreateStore(rightValue, val);

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
        this.currentVar.isLeft = true;
        const target = expr.target.accept(this);
        this.currentVar.isLeft = false;
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
        this.currentVar.isLeft = true;
        const target = expr.target.accept(this);
        this.currentVar.isLeft = false;
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
        const args = expr.arguments.map(arg => arg.accept(this));
        if (expr.callee instanceof VariableExpr) {
            const calleeVal = this.visitVariableExpr(expr.callee);
            if (calleeVal instanceof llvm.Function) { //直接调用函数
                return this.builder.CreateCall(calleeVal, args);
            }

            //闭包
            //提取函数指针
            const funcPtr = this.builder.CreateExtractValue(calleeVal, [0], "closure.code");
            const envPtr = this.builder.CreateExtractValue(calleeVal, [1], "closure.env");

            const calleeType = this.findVariable(expr.callee.name.lexeme).type;
            if (calleeType instanceof FunctionType) {
                const retType = this.llvmType(calleeType.returnType);
                const paramTypes = calleeType.paramTypes.map(param => this.llvmType(param));
                const funcType = llvm.FunctionType.get(retType, paramTypes, false);
                return this.builder.CreateCall(funcType, funcPtr, [envPtr, ...args]);
            }
        }
        throw new Error(`Unsupported callee type: ${expr.callee.accept(this).getType().toString()}. Expected Function or closure struct.`);
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
        const variable = this.findVariable(expr.name.lexeme);
        if (variable) {
            const val = variable.val;
            if (val instanceof llvm.Function) {
                return val;
            }

            const lType = this.llvmType(variable.type);
            if (this.currentVar.isLeft) {
                this.currentVar.lType = lType
                return variable.val;
            }
            return this.builder.CreateLoad(lType, val, expr.name.lexeme);
        }
        throw new Error(`Variable ${expr.name.lexeme} not found`);
    }
    visitLambdaExpr(expr: LambdaExpr): llvm.Value {
        //创建闭包环境类型
        const capturedTypes = expr.captured.map(captured =>
            llvm.PointerType.get(this.llvmType(captured.type), 0)
        );
        const envType = llvm.StructType.create(this.context, capturedTypes, "closure.env");

        //在堆上分配闭包环境
        const dataLayout = this.module.getDataLayout();
        const size = dataLayout.getTypeAllocSize(envType);
        // 将大小转换为 LLVM 的 ConstantInt
        const sizeValue = llvm.ConstantInt.get(llvm.Type.getInt32Ty(this.context), size);
        const envVal = this.builder.CreateCall(this.mallocFunc, [sizeValue], "closure.envPtr");
        for (let i = 0; i < expr.captured.length; i++) {
            const captured = expr.captured[i];
            const capturedVal = this.findVariable(captured.name.lexeme).val;
            const capturedConst = llvm.ConstantInt.get(llvm.Type.getInt32Ty(this.context), i);
            const val = this.builder.CreateGEP(envType, envVal, capturedConst, "closure.env.memPtr");
            this.builder.CreateStore(capturedVal, val);
        }

        this.currentClosure = {
            envType: envType,
            captured: expr.captured,
        }
        // 保存当前的插入点，以便编译完 lambda 函数后恢复
        const savedInsertBlock = this.builder.GetInsertBlock();
        //创建函数
        const retLType = this.llvmType(expr.returnType);

        const paramLTypes = expr.parameters.map(param => this.llvmType(param.type));
        const func = this.declareFunction("lambda", retLType, paramLTypes);
        this.defineFunction(func, expr.parameters, expr.body, expr.returnType);

        // 恢复原来的插入点，确保后续代码编译到正确的函数中
        if (savedInsertBlock) {
            this.builder.SetInsertPoint(savedInsertBlock);
        }
        const closureType = this.constantTypes.closure;
        //创建闭包结构体
        let closureVal = llvm.UndefValue.get(closureType);
        //填充code ptr
        let val = this.builder.CreateInsertValue(closureVal, func, [0], "closure.code");
        //填充env ptr const envType
        val = this.builder.CreateInsertValue(val, envVal, [1], "closure.env");

        this.currentClosure = null;
        return val;
    }

    visitCastExpr(expr: CastExpr): llvm.Value {
        const target = expr.target.accept(this);
        const targetType = this.llvmType(expr.type)
        return this.promoteType(target, targetType);
    }


    private declareFunction(funName: string, retType: llvm.Type, paramLTypes: llvm.Type[]): llvm.Function {
        if (this.currentClosure) {
            paramLTypes.unshift(llvm.PointerType.get(llvm.Type.getInt8PtrTy(this.context), 0));
        }
        const funcType = llvm.FunctionType.get(retType, paramLTypes, false);
        const func = llvm.Function.Create(funcType, llvm.Function.LinkageTypes.ExternalLinkage, funName, this.module);
        return func;
    }

    private defineFunction(func: llvm.Function, parameters: GSymbol[], body: Stmt[], retType: GrusType): void {
        // 保存旧的返回类型，设置新的返回类型
        const oldReturnType = this.currentFunction.returnType;
        this.currentFunction = {
            returnType: this.llvmType(retType),
        };

        // 创建函数的基本块并编译函数体
        const bb = llvm.BasicBlock.Create(this.context, 'entry', func);
        this.builder.SetInsertPoint(bb);

        this.beginScope();
        if (this.currentClosure) {
            const envPtr = func.getArg(0);
            const envType = this.currentClosure.envType;
            for (let i = 0; i < this.currentClosure.captured.length; i++) {
                const captured = this.currentClosure.captured[i];
                const capturedConst = llvm.ConstantInt.get(llvm.Type.getInt32Ty(this.context), i);
                const memPtr = this.builder.CreateGEP(envType, envPtr, capturedConst, "closure.env.memPtr");
                const ptrType = llvm.PointerType.get(this.llvmType(captured.type), 0);
                const memVal = this.builder.CreateLoad(ptrType, memPtr, "closure.env.memVal");
                this.define(captured.name.lexeme, memVal, captured.type);
            }
        }



        // 处理函数参数：为每个参数创建 alloca，并从函数参数中加载值存储到 alloca
        for (let i = 0; i < parameters.length; i++) {
            const param = parameters[i];
            const paramLType = this.llvmType(param.type);
            const paramAlloca = this.builder.CreateAlloca(paramLType, null, param.name.lexeme);
            const argInd = this.currentClosure ? i + 1 : i;
            // 从函数参数中获取值（函数参数是 Value，不是指针）
            const funcArg = func.getArg(argInd);
            if (funcArg) {
                // 将函数参数的值存储到 alloca
                this.builder.CreateStore(funcArg, paramAlloca);
            }
            // 将 alloca 存储到作用域中，供后续使用
            this.define(param.name.lexeme, paramAlloca, param.type);
        }


        // 编译函数体
        for (const bodyStmt of body) {
            this.compileStmt(bodyStmt);
        }

        // 检查函数的基本块是否已经有终止指令
        const currentBb = this.builder.GetInsertBlock();
        if (currentBb && !this.hasRetTerminator(currentBb)) {
            // 如果没有终止指令，根据返回类型添加默认返回
            if (retType instanceof SimpleType && retType.type === "void") {
                this.builder.CreateRetVoid();
            } else {
                // 非 void 函数如果没有 return 语句，标记为不可达
                this.builder.CreateUnreachable();
            }
        }

        this.endScope();



        // 恢复旧的返回类型
        this.currentFunction = {
            returnType: oldReturnType,
        };
    }

    //作用域
    beginScope(): void {
        const scope = new Map<string, {
            val: llvm.Value,
            type: GrusType,
        }>();
        this.currentScope = scope;
        this.scopes.push(scope);

    }
    endScope(): void {
        this.scopes.pop();
        this.currentScope = this.scopes[this.scopes.length - 1];
    }

    define(name: string, val: llvm.Value, type: GrusType): void {
        this.currentScope.set(name, {
            val: val,
            type: type,
        });
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
        console.log("-----", value, valueType, targetType);
        // 如果类型相同，不需要转换
        if (valueType === targetType) {
            return value;
        }
        if (value instanceof llvm.Function) {
            const closureType = this.constantTypes.closure;
            //创建闭包结构体
            let closureVal = llvm.UndefValue.get(closureType);
            const wfunc = this.fatFuncs.get(value)!;
            //填充code ptr
            let val = this.builder.CreateInsertValue(closureVal, wfunc, [0], "closure.code");
            //填充env ptr const envType
       
            return val;
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


    private findVariable(name: string) {
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            const scope = this.scopes[i];
            const variable = scope.get(name)
            if (variable) {
                return variable;
            }
        }
        throw new Error(`Variable ${name} not found`);
    }

    llvmType(type: GrusType): llvm.Type {
        if (type instanceof SimpleType) {
            switch (type.type) {
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
        //函数类型变量 转换为 闭包结构体
        if (type instanceof FunctionType) {
            return this.constantTypes.closure;
        }

        throw new Error(`Unsupported type: ${type}`);
    }

}
