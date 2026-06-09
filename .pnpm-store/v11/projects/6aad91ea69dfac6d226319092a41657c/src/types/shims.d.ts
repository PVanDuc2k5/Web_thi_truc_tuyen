declare module "react" {
    export type ComponentProps<T> = any;
    export type ImgHTMLAttributes<T> = any;
    export function useState<T>(initialState: T): [T, (value: T | ((previous: T) => T)) => void];
    const React: any;
    export default React;
}

declare module "react/jsx-runtime" {
    export const Fragment: any;
    export const jsx: any;
    export const jsxs: any;
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            [elemName: string]: any;
        }
    }
}

export { };