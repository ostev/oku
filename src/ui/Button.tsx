import { FunctionalComponent } from "preact"

export enum ButtonKind {
    Normal,
    Danger,
}

export const Button: FunctionalComponent<{
    kind?: ButtonKind
    onClick: () => void
    className?: string
}> = ({ children, kind, onClick, className }) => {
    const primaryClass = "bg-blue-500 hover:bg-blue-700"
    const dangerClass = "bg-red-500 hover:bg-red-700"

    return (
        <button
            type="button"
            class={`${
                kind === ButtonKind.Normal || kind === undefined
                    ? primaryClass
                    : dangerClass
            }  text-white font-bold py-1 px-4 rounded ${
                className !== undefined ? className : ""
            }`}
            onClick={onClick}
        >
            {children}
        </button>
    )
}
