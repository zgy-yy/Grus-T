import { Token } from "@/ast/Token";



export type ScannerErrorHandler = (line: number, column: number, message: string) => void;
export type ParserErrorHandler = (token: Token, message: string) => void;