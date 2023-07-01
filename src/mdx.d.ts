declare module "*.mdx" {
    let MDXComponent: (props: any) => JSX.Element
    export default MDXComponent

    export const title: string
    export const chapter: number
    export const section: number
}
