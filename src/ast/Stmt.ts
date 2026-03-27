import { Expr } from "@/ast/Expr";
import { Token } from "@/ast/Token";
import { FunctionTypeExpr, TypeExpr } from "./TypeExpr";

export abstract class Stmt {
    abstract accept<R>(visitor: StmtVisitor<R>): R;
}

export interface StmtVisitor<R> {
    visitBlockStmt(stmt: BlockStmt): R;
    visitVarStmt(stmt: VarStmt): R;
    visitFunctionStmt(stmt: FunctionStmt): R;
    visitExpressionStmt(stmt: ExpressionStmt): R;
    visitIfStmt(stmt: IfStmt): R;
    visitWhileStmt(stmt: WhileStmt): R;
    visitForStmt(stmt: ForStmt): R;
    visitDoWhileStmt(stmt: DoWhileStmt): R;
    visitLoopStmt(stmt: LoopStmt): R;
    visitBreakStmt(stmt: BreakStmt): R;
    visitContinueStmt(stmt: ContinueStmt): R;
    visitReturnStmt(stmt: ReturnStmt): R;
    visitClassStmt(stmt: ClassStmt): R;
    visitLabelStmt(stmt: LabelStmt): R;
    visitGotoStmt(stmt: GotoStmt): R;
    visitStructStmt(stmt: StructStmt): R;
    visitImportStmt(stmt: ImportStmt): R;

}


export class ImportStmt extends Stmt {
    path: Token;
    imports: {
        name: Token,
        alias: Token,
    }[]
    constructor(path: Token, imports: {
        name: Token,
        alias: Token,
    }[]) {
        super();
        this.path = path;
        this.imports = [];
    }
    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitImportStmt(this);
    }
}

export class WhileStmt extends Stmt {
    condition: Expr;
    body: Stmt;
    constructor(condition: Expr, body: Stmt) {
        super();
        this.condition = condition;
        this.body = body;
    }
    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitWhileStmt(this);
    }
}

export class DoWhileStmt extends Stmt {
    condition: Expr;
    body: Stmt;
    constructor(condition: Expr, body: Stmt) {
        super();
        this.condition = condition;
        this.body = body;
    }
    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitDoWhileStmt(this);
    }
}


export class ForStmt extends Stmt {
    initializer: Stmt | null;
    condition: Expr;
    increment: Expr | null;
    body: Stmt;

    constructor(initializer: Stmt | null, condition: Expr, increment: Expr | null, body: Stmt) {
        super();
        this.initializer = initializer;
        this.condition = condition;
        this.increment = increment;
        this.body = body;
    }
    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitForStmt(this);
    }
}
export class LoopStmt extends Stmt {
    body: Stmt;
    constructor(body: Stmt) {
        super();
        this.body = body;
    }
    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitLoopStmt(this);
    }
}

export class BreakStmt extends Stmt {
    keyword: Token;
    constructor(keyword: Token) {
        super();
        this.keyword = keyword;
    }
    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitBreakStmt(this);
    }
}
export class IfStmt extends Stmt {
    condition: Expr;
    thenBranch: Stmt;
    elseBranch: Stmt | null;
    constructor(condition: Expr, thenBranch: Stmt, elseBranch: Stmt | null) {
        super();
        this.condition = condition;
        this.thenBranch = thenBranch;
        this.elseBranch = elseBranch;
    }

    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitIfStmt(this);
    }
}

export class BlockStmt extends Stmt {
    statements: Stmt[];
    constructor(statements: Stmt[]) {
        super();
        this.statements = statements;
    }
    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitBlockStmt(this);
    }
}

export class ContinueStmt extends Stmt {
    keyword: Token;
    constructor(keyword: Token) {
        super();
        this.keyword = keyword;
    }
    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitContinueStmt(this);
    }
}

export class LabelStmt extends Stmt {
    label: Token;
    body: Stmt | null;
    constructor(label: Token, body: Stmt | null) {
        super();
        this.label = label;
        this.body = body;
    }
    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitLabelStmt(this);
    }
}

export class GotoStmt extends Stmt {
    label: Token;
    constructor(label: Token) {
        super();
        this.label = label;
    }
    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitGotoStmt(this);
    }
}

export class ExpressionStmt extends Stmt {
    expression: Expr;
    constructor(expression: Expr) {
        super();
        this.expression = expression;
    }

    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitExpressionStmt(this);
    }
}

export interface GSymbol {
    name: Token;
    escaped: boolean;
}

export class Variable implements GSymbol {
    name: Token;
    typeExpr: TypeExpr | null;
    operator: Token;
    defaultValue: Expr
    escaped: boolean;
    constructor(name: Token, typeExpr: TypeExpr | null, defaultValue: Expr, operator: Token) {
        this.name = name;
        this.typeExpr = typeExpr;
        this.defaultValue = defaultValue;
        this.escaped = false;
        this.operator = operator;
    }
}

export class Parameter implements GSymbol {
    name: Token;
    typeExpr: TypeExpr;
    escaped: boolean;
    constructor(name: Token, typeExpr: TypeExpr) {
        this.name = name;
        this.typeExpr = typeExpr;
        this.escaped = false;
    }
}





export class VarStmt extends Stmt {
    expose: boolean;
    vars: Variable[];
    constructor(vars: Variable[]) {
        super();
        this.expose = false;
        this.vars = vars;
    }
    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitVarStmt(this);
    }
}


export class FunctionStmt extends Stmt {
    expose: boolean;
    name: Token;
    parameters: Parameter[];
    body: Stmt[];
    returnType: TypeExpr ;
    constructor(name: Token, parameters: Parameter[], returnType: TypeExpr, body: Stmt[]) {
        super();
        this.expose = false;
        this.name = name;
        this.parameters = parameters;
        this.body = body;
        this.returnType = returnType;
    }
    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitFunctionStmt(this);
    }
}

export class ReturnStmt extends Stmt {
    keyword: Token;
    value: Expr | null;
    constructor(keyword: Token, value: Expr | null) {
        super();
        this.keyword = keyword;
        this.value = value;
    }
    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitReturnStmt(this);
    }
}


export class Field {
    name: Token;
    typeExpr: TypeExpr;
    escaped: boolean;
    constructor(name: Token, typeExpr: TypeExpr) {
        this.name = name;
        this.typeExpr = typeExpr;
        this.escaped = false;
    }
}


export class StructStmt extends Stmt {
    expose: boolean;
    name: Token;
    fields: Field[];
    constructor(name: Token, fields: Field[]) {
        super();
        this.expose = false;
        this.name = name;
        this.fields = fields;
    }
    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitStructStmt(this);
    }
}

export class ClassStmt extends Stmt {
    expose: boolean;
    name: Token;
    methods: FunctionStmt[];
    fields: Field[];
    constructor(name: Token, fields: Field[], methods: FunctionStmt[]) {
        super();
        this.expose = false;
        this.name = name;
        this.methods = methods;
        this.fields = fields;
    }
    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitClassStmt(this);
    }
}

/** 顶层程序语句顺序：Import → Struct → Function → Var，其余类型排在最后 */
export function programStmtSortKey(stmt: Stmt): number {
    if (stmt instanceof ImportStmt) return 0;
    if (stmt instanceof StructStmt) return 1;
    if (stmt instanceof FunctionStmt) return 2;
    if (stmt instanceof VarStmt) return 3;
    return 4;
}