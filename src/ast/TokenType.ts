

/**
 * 词法单元类型
 */
export enum TokenType {
    //单字符 token
    LeftParen = 'LEFT_PAREN',// (
    RightParen = 'RIGHT_PAREN',// )
    LeftBrace = 'LEFT_BRACE',// {
    RightBrace = 'RIGHT_BRACE',// }
    Comma = 'COMMA',// ,
    Dot = 'DOT',// .
    Minus = 'MINUS',// -
    Plus = 'PLUS',// +
    Semicolon = 'SEMICOLON',// ;
    Slash = 'SLASH',// /
    Star = 'STAR',// *
    Question = 'QUESTION',// ?
    Colon = 'COLON',// :
    Percent = 'PERCENT',// %
    Caret = 'CARET',// ^
    Tilde = 'TILDE',// ~

    // 多字符 token
    Bang = 'BANG',// !
    BangEqual = 'BANG_EQUAL',// !=
    Equal = 'EQUAL',// =
    EqualEqual = 'EQUAL_EQUAL',// ==
    Greater = 'GREATER',// >
    GreaterEqual = 'GREATER_EQUAL',// >=
    Less = 'LESS',// <
    LessEqual = 'LESS_EQUAL',// <=
    BitAnd = 'BIT_AND',// &
    BitOr = 'BIT_OR',// |
    And = 'AND',// &&    
    Or = 'OR',// ||
    GreaterGreater = 'GREATER_GREATER',// >>
    LessLess = 'LESS_LESS',// <<
    PlusPlus = 'PLUS_PLUS',// ++
    MinusMinus = 'MINUS_MINUS',// --
    PlusEqual = 'PLUS_EQUAL',// +=
    MinusEqual = 'MINUS_EQUAL',// -=
    StarEqual = 'STAR_EQUAL',// *=
    SlashEqual = 'SLASH_EQUAL',// /=
    PercentEqual = 'PERCENT_EQUAL',// %=
    CaretEqual = 'CARET_EQUAL',// ^=
    AndEqual = 'AND_EQUAL',// &=
    OrEqual = 'OR_EQUAL',// |=
    GreaterGreaterEqual = 'GREATER_GREATER_EQUAL',// >>=
    LessLessEqual = 'LESS_LESS_EQUAL',// <<=
    // Arrow = 'ARROW',// =>

    // 关键字
    Goto = 'GOTO',// goto
    Class = 'CLASS',// class
    Struct = 'STRUCT',// struct
    New = 'NEW',// new
    Else = 'ELSE',// else
    False = 'FALSE',// false
    For = 'FOR',// for
    Fun = 'FUN',// fun
    If = 'IF',// if
    Null = 'NULL',// null
    Return = 'RETURN',// return
    Super = 'SUPER',// super
    This = 'THIS',// this
    True = 'TRUE',// true
    // Var = 'VAR',// var
    Let = 'LET',// let
    While = 'WHILE',// while
    Do = 'DO',// do
    Loop = 'LOOP',// loop
    Break = 'BREAK',// break
    Continue = 'CONTINUE',// continue
    // 标识符
    Identifier = 'IDENTIFIER',// identifier
    Symbol = 'SYMBOL',// symbol 用于表示自定义类型
    // 字面量
    String = 'STRING',// string
    Number = 'NUMBER',// number
    // 特殊 token
    EOF = 'EOF',// eof
}