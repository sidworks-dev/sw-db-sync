declare module 'boxen' {
    export interface Options {
        padding?: number | { top?: number; bottom?: number; left?: number; right?: number };
        margin?: number | { top?: number; bottom?: number; left?: number; right?: number };
        borderStyle?: string;
        borderColor?: string;
        title?: string;
        titleAlignment?: string;
    }

    function boxen(_text: string, _options?: Options): string;
    export default boxen;
}
