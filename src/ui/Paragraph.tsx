import { FunctionalComponent } from "preact"

export const Paragraph: FunctionalComponent<{ className?: string }> = ({
    children,
    className,
}) => (
    <p class={`my-3 ${className === undefined ? "" : className}`}>{children}</p>
)
