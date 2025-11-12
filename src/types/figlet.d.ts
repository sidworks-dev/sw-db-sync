declare module 'figlet' {
    export interface Options {
        font?: string;
        horizontalLayout?: string;
        verticalLayout?: string;
        width?: number;
        whitespaceBreak?: boolean;
    }

    export function textSync(_text: string, _options?: Options): string;
    export function text(_text: string, _options: Options, _callback: (_err: Error | null, _data?: string) => void): void;
    export function text(_text: string, _callback: (_err: Error | null, _data?: string) => void): void;
}
