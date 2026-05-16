declare module 'papaparse' {
  export interface ParseMeta {
    fields?: string[];
  }

  export interface ParseError {
    type: string;
    code: string;
    message: string;
    row?: number;
  }

  export interface ParseResult<T> {
    data: T[];
    errors: ParseError[];
    meta: ParseMeta;
  }

  export interface ParseLocalConfig {
    header?: boolean;
    complete?: (results: ParseResult<unknown>) => void;
    error?: (error: Error) => void;
  }

  function parse(input: File | string, config?: ParseLocalConfig): void;
  function unparse(data: unknown[] | object, config?: object): string;

  const Papa: {
    parse: typeof parse;
    unparse: typeof unparse;
  };

  export default Papa;
}
