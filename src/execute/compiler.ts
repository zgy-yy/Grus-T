import { AssignExpr, BinaryExpr, CallExpr, CastExpr, ConditionalExpr, Expr, ExprVisitor, GetExpr, ImplicitCastExpr, LambdaExpr, LiteralExpr, LogicalExpr, PointExpr, PostfixExpr, PrefixExpr, SetExpr, ThisExpr, UnaryExpr, VariableExpr } from "@/ast/Expr";
import { BlockStmt, BreakStmt, ClassStmt, ContinueStmt, DoWhileStmt, ExpressionStmt, ForStmt, FunctionStmt, GotoStmt, GSymbol, IfStmt, LabelStmt, LoopStmt, Parameter, ReturnStmt, StmtVisitor, StructStmt, VarStmt, WhileStmt } from "@/ast/Stmt";
import { Stmt } from "@/ast/Stmt";
import { CompilerErrorHandler } from "@/parser/ErrorHandler";
import { Token } from "@/ast/Token";
import llvm from "@wangziwenhk/llvm-bindings";
import { FunctionType, GrusType, PointerType, SimpleType, TempOmittedType } from "@/ast/GrusTypes";
import { TokenType } from "@/ast/TokenType";
import { Environment } from "./Environment";

export class CompilerError extends Error {
    public token: Token;
    constructor(token: Token, message: string) {
        super(message);
        this.token = token;
    }
}


export class GValue {
    val: llvm.Value;
    gType: GrusType;
    constructor(val: llvm.Value, type: GrusType) {
        this.val = val;
        this.gType = type;
    }
}

export class Compiler implements ExprVisitor<GValue>, StmtVisitor<void> {

    private loopStack: {
        continueBb: llvm.BasicBlock,
        breakBb: llvm.BasicBlock,
    }[] = [];
    private labelMap: Map<string, llvm.BasicBlock> = new Map<string, llvm.BasicBlock>();
    private IdentifierType: Map<Token, GrusType> = new Map<Token, GrusType>();
    readonly globalEnv: Environment = new Environment(null);
    private environment: Environment = this.globalEnv;
    private readonly locals: Map<Expr, number> = new Map();
    private currentFunction: {
        returnType: llvm.Type,
    }


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
        const mallocType = llvm.FunctionType.get(this.constantTypes.ptr, [this.constantTypes.i32], false);
        this.mallocFunc = this.module.getOrInsertFunction('malloc', mallocType);

    }

    resolveIdentifier(name: Token, type: GrusType): void {
        this.IdentifierType.set(name, type);
    }
    resolve(expr: Expr, depth: number): void {
        this.locals.set(expr, depth);
    }

    compileProgram(stmts: Stmt[]): string {
        //默认声明printf
        const LType = llvm.FunctionType.get(this.constantTypes.i32, [this.constantTypes.ptr], true);
        const printf = llvm.Function.Create(LType, llvm.Function.LinkageTypes.ExternalLinkage, "printf", this.module);
        this.define("printf", printf, new FunctionType(new SimpleType("i32"), [new SimpleType("string"), new TempOmittedType()], true));

        // ========== 第一遍编译：声明所有函数 ==========
        // 目的：创建所有函数的签名（函数类型和名称），但不编译函数体
        for (const stmt of stmts) {
            if (stmt instanceof FunctionStmt) {
                const funName = stmt.name.lexeme;
                const funType = this.IdentifierType.get(stmt.name);
                if (funType && funType instanceof FunctionType) {
                    const retLType = this.llvmType(funType.returnType);
                    const paramLTypes = funType.paramTypes.map(type => this.llvmType(type));
                    const fun = this.declareFunction(funName, retLType, paramLTypes, false);
                    this.define(funName, fun, funType);
                } else {
                    throw new Error("Function type not found");
                }

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


    visitStructStmt(stmt: StructStmt): void {
        throw new Error("Method not implemented.");
    }
    visitVarStmt(stmt: VarStmt): void {
        for (const variable of stmt.vars) {
            const varType = this.IdentifierType.get(variable.name);
            if (!varType) {
                throw new Error("Variable type not found");
            }
            const allocType = this.llvmType(varType);
            const varName = variable.name.lexeme;

            const allocAddr = this.builder.CreateAlloca(allocType, null, varName);
            this.define(varName, allocAddr, varType);
            const value = variable.defaultValue.accept(this);
            const lvalue = this.promoteType(value.val, allocType);
            this.builder.CreateStore(lvalue, allocAddr);
        }
    }
    visitFunctionStmt(stmt: FunctionStmt): void {
        const funName = stmt.name.lexeme;
        const funType = this.IdentifierType.get(stmt.name);
        if (!funType || !(funType instanceof FunctionType)) {
            throw new Error("Function type not found");
        }
        // 第二遍编译：获取已声明的函数（在第一遍中已创建）
        let func = this.environment.get(funName).val as llvm.Function;
        this.defineFunction(func, stmt.parameters, stmt.body, funType.returnType, null);
        //生成胖函数
        const paramLTypes = funType.paramTypes.map(type => this.llvmType(type));
        paramLTypes.unshift(llvm.PointerType.get(llvm.Type.getInt8PtrTy(this.context), 0));

        const retType = this.llvmType(funType.returnType);
        const funcType = llvm.FunctionType.get(retType, paramLTypes, false);
        const wfunc = llvm.Function.Create(funcType, llvm.Function.LinkageTypes.ExternalLinkage, `${funName}_wrapper`, this.module);
        const bb = llvm.BasicBlock.Create(this.context, 'entry', wfunc);  // 修复：应该为 wfunc 创建基本块，而不是 func
        this.builder.SetInsertPoint(bb);
        const args = stmt.parameters.map((param, ind) => wfunc.getArg(ind + 1));
        const result = this.builder.CreateCall(func, args);
        if (funType.returnType instanceof SimpleType && funType.returnType.type === "void") {
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
        this.builder.CreateCondBr(condition.val, thenBb, elseBb);
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
        this.builder.CreateCondBr(condition.val, bodyBb, endBb);
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
        this.builder.CreateCondBr(condition.val, bodyBb, endBb);
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
        this.builder.CreateCondBr(condition.val, bodyBb, endBb);
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
            const lvalue = this.promoteType(value.val, this.currentFunction.returnType);
            this.builder.CreateRet(lvalue);
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
    visitAssignExpr(expr: AssignExpr): GValue {
        const value = expr.value.accept(this);
        const target = expr.target.accept(this);
        this.builder.CreateStore(value.val, target.val);
        return value;
    }
    visitPointExpr(expr: PointExpr): GValue {
        const target = expr.target.accept(this);
        const value = expr.value.accept(this);
        this.builder.CreateStore(value.val, target.val);
        return value;
    }
    visitConditionalExpr(expr: ConditionalExpr): GValue {
        throw new Error("Method not implemented.");
    }
    visitLogicalExpr(expr: LogicalExpr): GValue {
        throw new Error("Method not implemented.");
    }

    visitBinaryExpr(expr: BinaryExpr): GValue {
        const parentFunc = this.findParentFunction();
        switch (expr.operator.type) {
            case TokenType.And:
                {
                    const rhsBb = llvm.BasicBlock.Create(this.context, 'and.rhs', parentFunc);
                    const mergeBb = llvm.BasicBlock.Create(this.context, 'and.merge', parentFunc);
                    const leftValue = expr.left.accept(this);
                    const startBb = this.builder.GetInsertBlock();
                    //短路跳转，真值跳转到rhsBb，假值跳转到mergeBb
                    this.builder.CreateCondBr(leftValue.val, rhsBb, mergeBb);
                    //填充rhsBb
                    this.builder.SetInsertPoint(rhsBb);
                    const rightValue = expr.right.accept(this);
                    const rhsActualBb = this.builder.GetInsertBlock();
                    this.builder.CreateBr(mergeBb);
                    //填充mergeBb，合并lhs和rhs的值
                    this.builder.SetInsertPoint(mergeBb);
                    const phi = this.builder.CreatePHI(this.builder.getInt1Ty(), 2, "and_res");
                    phi.addIncoming(this.builder.getInt1(false), startBb!); // 来自 LHS 的假
                    phi.addIncoming(rightValue.val, rhsActualBb!);                 // 来自 RHS 的结果
                    return new GValue(phi, new SimpleType("bool"));
                }
            case TokenType.Or:
                {
                    const rhsBb = llvm.BasicBlock.Create(this.context, 'or.rhs', parentFunc);
                    const mergeBb = llvm.BasicBlock.Create(this.context, 'or.merge', parentFunc);
                    const leftValue = expr.left.accept(this);
                    const startBb = this.builder.GetInsertBlock();
                    //短路跳转，真值跳转到mergeBb,假值跳转到rhsBb
                    this.builder.CreateCondBr(leftValue.val, mergeBb, rhsBb);
                    //填充rhsBb
                    this.builder.SetInsertPoint(rhsBb);
                    const rightValue = expr.right.accept(this);
                    const rhsActualBb = this.builder.GetInsertBlock();
                    this.builder.CreateBr(mergeBb);
                    //填充mergeBb，合并lhs和rhs的值
                    this.builder.SetInsertPoint(mergeBb);
                    const phi = this.builder.CreatePHI(this.builder.getInt1Ty(), 2, "or_res");
                    phi.addIncoming(leftValue.val, startBb!); // 来自 LHS 的结果
                    phi.addIncoming(rightValue.val, rhsActualBb!);                 // 来自 RHS 的结果
                    return new GValue(phi, new SimpleType("bool"));
                }
        }



        let left = expr.left.accept(this);
        let right = expr.right.accept(this);
        const isFloat = this.isFloatType(left.gType) || this.isFloatType(right.gType);
        if (isFloat) {
            let res = new GValue(left.val, left.gType);
            switch (expr.operator.type) {
                case TokenType.Plus:
                    res.val = this.builder.CreateFAdd(left.val, right.val);
                    return res;
                case TokenType.Minus:
                    res.val = this.builder.CreateFSub(left.val, right.val);
                    return res;
                case TokenType.Star:
                    res.val = this.builder.CreateFMul(left.val, right.val);
                    return res;
                case TokenType.Slash:
                    res.val = this.builder.CreateFDiv(left.val, right.val);
                    return res;
                case TokenType.Percent:
                    res.val = this.builder.CreateFRem(left.val, right.val);
                    return res;
                case TokenType.EqualEqual:
                    res.val = this.builder.CreateFCmpOEQ(left.val, right.val);
                    return res;
                case TokenType.BangEqual:
                    res.val = this.builder.CreateFCmpUNE(left.val, right.val);
                    return res;
                case TokenType.Greater:
                    res.val = this.builder.CreateFCmpOGT(left.val, right.val);
                    return res;
                case TokenType.GreaterEqual:
                    res.val = this.builder.CreateFCmpOGE(left.val, right.val);
                    return res;
                case TokenType.Less:
                    res.val = this.builder.CreateFCmpOLT(left.val, right.val);
                    return res;
                case TokenType.LessEqual:
                    res.val = this.builder.CreateFCmpOLE(left.val, right.val);
                    return res;
                default:
                    throw new Error(`Unsupported binary operator: ${expr.operator.type}`);
            }
            return res;
        } else {
            let res = new GValue(left.val, left.gType);
            switch (expr.operator.type) {
                case TokenType.Plus:
                    res.val = this.builder.CreateAdd(left.val, right.val);
                    return res;
                case TokenType.Minus:
                    res.val = this.builder.CreateSub(left.val, right.val);
                    return res;
                case TokenType.Star:
                    res.val = this.builder.CreateMul(left.val, right.val);
                    return res;
                case TokenType.Slash:
                    res.val = this.builder.CreateSDiv(left.val, right.val);
                    return res;
                case TokenType.Percent:
                    res.val = this.builder.CreateSRem(left.val, right.val);
                    return res;
                case TokenType.Less:
                    res.val = this.builder.CreateICmpSLT(left.val, right.val);
                    return res;
                case TokenType.Greater:
                    res.val = this.builder.CreateICmpSGT(left.val, right.val);
                    return res;
                case TokenType.LessEqual:
                    res.val = this.builder.CreateICmpSLE(left.val, right.val);
                    return res;
                case TokenType.GreaterEqual:
                    res.val = this.builder.CreateICmpSGE(left.val, right.val);
                    return res;
                case TokenType.EqualEqual:
                    res.val = this.builder.CreateICmpEQ(left.val, right.val);
                    return res;
                case TokenType.BangEqual:
                    res.val = this.builder.CreateICmpNE(left.val, right.val);
                    return res;
                case TokenType.BitAnd:
                    res.val = this.builder.CreateAnd(left.val, right.val);
                    return res;
                case TokenType.BitOr:
                    res.val = this.builder.CreateOr(left.val, right.val);
                    return res;
                case TokenType.Caret:
                    res.val = this.builder.CreateXor(left.val, right.val);
                    return res;
                case TokenType.LessLess:
                    res.val = this.builder.CreateShl(left.val, right.val);
                    return res;
                case TokenType.GreaterGreater:
                    res.val = this.builder.CreateAShr(left.val, right.val);
                    return res;
            }
        }

        throw new Error(`Unsupported binary operator: ${expr.operator.type}`);
    }
    visitUnaryExpr(expr: UnaryExpr): GValue {
        const operator = expr.operator
        switch (operator.type) {
            case TokenType.Minus:
                const operand = expr.right.accept(this);
                const isFloat = this.isFloatType(operand.gType);
                if (isFloat) {

                    const val = this.builder.CreateFNeg(operand.val);
                    return new GValue(val, operand.gType);
                } else {
                    const val = this.builder.CreateNeg(operand.val);
                    return new GValue(val, operand.gType);
                }
            case TokenType.Tilde:
                {
                    const rv = expr.right.accept(this);
                    const val = this.builder.CreateNot(rv.val);
                    return new GValue(val, rv.gType);
                }
            case TokenType.Bang:
                {
                    const rv = expr.right.accept(this);
                    const val = this.builder.CreateNot(rv.val);
                    return new GValue(val, rv.gType);
                }
        }
        throw new Error(`Unsupported unary operator: ${operator.type}`);
    }
    visitLiteralExpr(expr: LiteralExpr): GValue {
        switch (expr.literalType) {
            case 'string':
                {
                    const val = this.builder.CreateGlobalStringPtr(expr.value);
                    return new GValue(val, new SimpleType("string"));
                }
            case 'bool':
                {
                    const val = this.builder.getInt1(expr.value === 'true' ? true : false);
                    return new GValue(val, new SimpleType("bool"));
                }
            case 'i8':
                {
                    const val = this.builder.getInt8(Number(expr.value));
                    return new GValue(val, new SimpleType("i8"));
                }
            case 'i16':
                {
                    const val = this.builder.getInt16(Number(expr.value));
                    return new GValue(val, new SimpleType("i16"));
                }
            case 'i32':
                {
                    const val = this.builder.getInt32(Number(expr.value));
                    return new GValue(val, new SimpleType("i32"));
                }
            case 'i64':
                {
                    const val = this.builder.getInt64(Number(expr.value));
                    return new GValue(val, new SimpleType("i64"));
                }
            case 'float':
                {
                    const floatTy = llvm.Type.getFloatTy(this.context);
                    const val = llvm.ConstantFP.get(floatTy, Number(expr.value));
                    return new GValue(val, new SimpleType("float"));
                }
            case 'double':
                {
                    const doubleTy = llvm.Type.getDoubleTy(this.context);
                    const val = llvm.ConstantFP.get(doubleTy, Number(expr.value));
                    return new GValue(val, new SimpleType("double"));
                }
        }
        const val = this.builder.getInt32(0);
        return new GValue(val, new SimpleType("i32"));
    }
    visitPostfixExpr(expr: PostfixExpr): GValue {
        const target = expr.target.accept(this);
        const oldValue = this.builder.CreateLoad(this.llvmType(target.gType), target.val);
        switch (expr.operator.type) {
            case TokenType.PlusPlus:
                {
                    const newValue = this.builder.CreateAdd(oldValue, this.builder.getInt32(1));
                    this.builder.CreateStore(newValue, target.val);
                    return new GValue(oldValue, target.gType);
                }
            case TokenType.MinusMinus:
                {
                    const newValue = this.builder.CreateSub(oldValue, this.builder.getInt32(1));
                    this.builder.CreateStore(newValue, target.val);
                    return new GValue(oldValue, target.gType);
                }
                break;
        }
        throw new Error(`Unsupported postfix operator: ${expr.operator.type}`);
    }
    visitPrefixExpr(expr: PrefixExpr): GValue {
        const target = expr.target.accept(this);
        const oldValue = this.builder.CreateLoad(this.llvmType(target.gType), target.val);
        switch (expr.operator.type) {
            case TokenType.PlusPlus:
                {
                    const newValue = this.builder.CreateAdd(oldValue, this.builder.getInt32(1));
                    this.builder.CreateStore(newValue, target.val);
                    return new GValue(newValue, target.gType);
                }
                break;
            case TokenType.MinusMinus:
                {
                    const newValue = this.builder.CreateSub(oldValue, this.builder.getInt32(1));
                    this.builder.CreateStore(newValue, target.val);
                    return new GValue(newValue, target.gType);
                }
                break;
        }
        throw new Error(`Unsupported prefix operator: ${expr.operator.type}`);
    }
    visitCallExpr(expr: CallExpr): GValue {
        const args = expr.arguments.map((arg) => arg.accept(this)).map(arg => arg.val);
        const callee = expr.callee.accept(this);
        if (callee.gType instanceof FunctionType) {

            if (!callee.gType.isLocal) {
                // closure 结构体：索引0是函数指针，索引1是环境指针
                const closureFuncPtr = this.builder.CreateExtractValue(callee.val, [0], "closure.funcPtr");
                const closureEnvPtr = this.builder.CreateExtractValue(callee.val, [1], "closure.envPtr");
                args.unshift(closureEnvPtr);
                callee.val = closureFuncPtr;
            }
            const returnLType = this.llvmType(callee.gType.returnType);
            const lastParamType = callee.gType.paramTypes[callee.gType.paramTypes.length - 1];
            const paramsLTypes = [];
            let isVarArgs = false;
            if (lastParamType instanceof TempOmittedType) {
                const params = callee.gType.paramTypes.slice(0, -1);
                paramsLTypes.push(...params.map(param => this.llvmType(param)));
                if (!callee.gType.isLocal) {
                    paramsLTypes.unshift(llvm.PointerType.get(llvm.Type.getInt8PtrTy(this.context), 0));
                }
                isVarArgs = true;
            } else {
                paramsLTypes.push(...callee.gType.paramTypes.map(param => this.llvmType(param)));
                if (!callee.gType.isLocal) {
                    paramsLTypes.unshift(llvm.PointerType.get(llvm.Type.getInt8PtrTy(this.context), 0));
                }
            }
            const funcType = llvm.FunctionType.get(returnLType, paramsLTypes, isVarArgs);

            const data = this.builder.CreateCall(funcType, callee.val, args);
            return new GValue(data, callee.gType.returnType);
        }
        throw new Error(`Unsupported callee type: ${callee.gType.toString()}. Expected Function or closure struct.`);
    }
    visitSetExpr(expr: SetExpr): GValue {
        throw new Error("Method not implemented.");
    }
    visitGetExpr(expr: GetExpr): GValue {
        throw new Error("Method not implemented.");
    }
    visitThisExpr(expr: ThisExpr): GValue {
        throw new Error("Method not implemented.");
    }
    visitVariableExpr(expr: VariableExpr): GValue {
        const value = this.lookupVariable(expr.name, expr);
        if (value.gType instanceof FunctionType) {
            if (value.gType.isLocal) {
                return value;
            }
        } else if (value.gType instanceof PointerType) {
            const ptrType = this.llvmType(value.gType);
            const dataAddr = this.builder.CreateLoad(ptrType, value.val, expr.name.lexeme);
            if (expr.addr) {
                return new GValue(dataAddr, value.gType);
            }
            const dataType = this.llvmType(value.gType.oriType);
            const data = this.builder.CreateLoad(dataType, dataAddr, expr.name.lexeme);
            return new GValue(data, value.gType.oriType);
        }
        if (expr.addr) {
            return value;
        }
        const lType = this.llvmType(value.gType);
        const data = this.builder.CreateLoad(lType, value.val, expr.name.lexeme);
        return new GValue(data, value.gType);
    }

    private lookupVariable(name: Token, expr: Expr): GValue {
        const distance = this.locals.get(expr);
        const variable = this.environment.getAt(distance!, name.lexeme);
        return variable;
    }
    visitLambdaExpr(expr: LambdaExpr): GValue {
        const captures = Array.from(expr.captured.entries()).map(i => ({ name: i[0], type: i[1] }));
        //创建闭包环境类型 结构体的每个元素都是指针类型，用于指向捕获的变量
        const capturedStructType = captures.map(captured => this.constantTypes.ptr);
        const envType = llvm.StructType.create(this.context, capturedStructType, "closure.env");

        //在堆上分配闭包环境
        const dataLayout = this.module.getDataLayout();
        const size = dataLayout.getTypeAllocSize(envType);
        // 将大小转换为 LLVM 的 ConstantInt
        const sizeValue = llvm.ConstantInt.get(llvm.Type.getInt32Ty(this.context), size);
        const envVal = this.builder.CreateCall(this.mallocFunc, [sizeValue], "closure.envPtr");

        for (let i = 0; i < captures.length; i++) {
            const captured = captures[i];
            const capturedVal = this.environment.get(captured.name);
            const capturedConst = llvm.ConstantInt.get(llvm.Type.getInt32Ty(this.context), i);
            const val = this.builder.CreateGEP(envType, envVal, capturedConst, "closure.env.memPtr");
            this.builder.CreateStore(capturedVal.val, val);
        }

        // 保存当前的插入点，以便编译完 lambda 函数后恢复
        const savedInsertBlock = this.builder.GetInsertBlock();
        const funType = this.IdentifierType.get(expr.paren);
        if (!funType || !(funType instanceof FunctionType)) {
            throw new Error("Function type not found");
        }
        //创建函数
        const retLType = this.llvmType(funType.returnType);

        const paramLTypes = funType.paramTypes.map(type => this.llvmType(type));
        const func = this.declareFunction("lambda", retLType, paramLTypes, true);
        this.defineFunction(func, expr.parameters, expr.body, funType.returnType, captures);

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

        return new GValue(val, funType);
    }

    visitCastExpr(expr: CastExpr): GValue {
        const tarType = this.IdentifierType.get(expr.paren);
        if (!tarType) {
            throw new Error("Target type not found");
        }
        const sourceValue = expr.source.accept(this);
        const targetType = this.llvmType(tarType)
        const targetValue = this.promoteType(sourceValue.val, targetType);
        return new GValue(targetValue, tarType);
    }

    visitImplicitCastExpr(expr: ImplicitCastExpr): GValue {
        const sourceValue = expr.source.accept(this);
        const targetType = this.llvmType(expr.targetType);
        const targetValue = this.promoteType(sourceValue.val, targetType);
        return new GValue(targetValue, expr.targetType);
    }

    private declareFunction(funName: string, retType: llvm.Type, paramLTypes: llvm.Type[], isClosure: boolean): llvm.Function {
        if (isClosure) {
            paramLTypes.unshift(llvm.PointerType.get(llvm.Type.getInt8PtrTy(this.context), 0));
        }
        const funcType = llvm.FunctionType.get(retType, paramLTypes, false);
        const func = llvm.Function.Create(funcType, llvm.Function.LinkageTypes.ExternalLinkage, funName, this.module);
        return func;
    }

    private defineFunction(func: llvm.Function, parameters: Parameter[], body: Stmt[], retType: GrusType, closureEnv: {
        name: string,
        type: GrusType
    }[]|null): void {
        // 保存旧的返回类型，设置新的返回类型
        const oldReturnType = this.currentFunction.returnType;
        this.currentFunction = {
            returnType: this.llvmType(retType),
        };

        // 创建函数的基本块并编译函数体
        const bb = llvm.BasicBlock.Create(this.context, 'entry', func);
        this.builder.SetInsertPoint(bb);

        this.beginScope();
       
        if (closureEnv) {
            const envPtr = func.getArg(0);
            for (let i = 0; i < closureEnv.length; i++) {
                const captured = closureEnv[i];
                const capturedConst = llvm.ConstantInt.get(llvm.Type.getInt32Ty(this.context), i);
                const capturedType = this.llvmType(captured.type);
                const memPtr = this.builder.CreateGEP(capturedType, envPtr, capturedConst, "closure.env.memPtr");
                const ptrType = llvm.PointerType.get(capturedType, 0);
                const memVal = this.builder.CreateLoad(ptrType, memPtr, "closure.env.memVal");
                this.define(captured.name, memVal, captured.type);
            }
        }
        // 处理函数参数：为每个参数创建 alloca，并从函数参数中加载值存储到 alloca
        for (let i = 0; i < parameters.length; i++) {
            const param = parameters[i];
            const paramType = this.IdentifierType.get(param.name);
            if (!paramType) {
                throw new Error("Parameter type not found");
            }
            const paramLType = this.llvmType(paramType);

            const argInd = closureEnv ? i + 1 : i;
            // 从函数参数中获取值（函数参数是 Value，不是指针）
            const funcArg = func.getArg(argInd);
            if (param.escaped) {
                const dataLayout = this.module.getDataLayout();
                const size = dataLayout.getTypeAllocSize(paramLType);
                // 将大小转换为 LLVM 的 ConstantInt
                const sizeValue = llvm.ConstantInt.get(llvm.Type.getInt32Ty(this.context), size);
                const val = this.builder.CreateCall(this.mallocFunc, [sizeValue]);
                this.builder.CreateStore(funcArg, val);
                this.define(param.name.lexeme, val, paramType);
            } else {
                // 将 alloca 存储到作用域中，供后续使用
                const paramAlloca = this.builder.CreateAlloca(paramLType, null, param.name.lexeme);
                this.builder.CreateStore(funcArg, paramAlloca);
                this.define(param.name.lexeme, paramAlloca, paramType);
            }
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
        this.environment = new Environment(this.environment);
    }
    endScope(): void {
        this.environment = this.environment.enclosing!;
    }

    define(name: string, val: llvm.Value, type: GrusType): void {
        this.environment.define(name, new GValue(val, type));
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
    private promoteType(value: llvm.Value, targetType: llvm.Type): llvm.Value {
        const valueType = value.getType();
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

        const valueIsFloat = this.getIntegerBitWidth(valueType) == 0;
        const targetIsFloat = this.getIntegerBitWidth(targetType) == 0;

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
    private isFloatType(type: GrusType): boolean {
        if (type instanceof SimpleType) {
            return ["float", "double"].includes(type.type);
        }
        return false;
    }

    /**
     * 检查基本块是否已经有终止指令（terminator）
     */
    private hasRetTerminator(bb: llvm.BasicBlock): boolean {
        const terminator = bb.getTerminator();
        return terminator instanceof llvm.ReturnInst;
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
                case 'string':
                    return this.constantTypes.ptr;
            }
        }
        //函数类型变量 转换为 闭包结构体
        if (type instanceof FunctionType) {
            return this.constantTypes.closure;
        }
        if (type instanceof PointerType) {
            return llvm.PointerType.get(this.llvmType(type.oriType), 0);
        }
        throw new Error(`Unsupported type: ${type}`);
    }

}
