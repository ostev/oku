import { FunctionalComponent } from "preact"

export enum ButtonKind {
    Normal,
    Danger,
    Green,
    Underline,
}

export const Button: FunctionalComponent<{
    kind?: ButtonKind
    onClick: () => void
    className?: string
}> = ({ children, kind, onClick, className }) => {
    const primaryClass = "bg-blue-600 hover:bg-blue-800"
    const dangerClass = "bg-red-600 hover:bg-red-800"
    const greenClass = "bg-green-600 hover:bg-green-800"

    if (kind !== ButtonKind.Underline) {
        return (
            <button
                type="button"
                class={`${
                    kind === ButtonKind.Normal || kind === undefined
                        ? primaryClass
                        : kind === ButtonKind.Danger
                        ? dangerClass
                        : greenClass
                }  text-white font-bold py-1 px-4 rounded drop-shadow-lg ${
                    className !== undefined ? className : ""
                }`}
                onClick={onClick}
            >
                {children}
            </button>
        )
    } else {
        return (
            <button
                type="button"
                class={`underline--magical py-1 px-4 font-serif ${
                    className !== undefined ? className : ""
                }`}
                onClick={onClick}
            >
                {children}
            </button>
        )
    }
}
