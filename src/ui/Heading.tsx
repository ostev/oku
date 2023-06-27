import { FunctionalComponent, h } from "preact"
import { error } from "../helpers"

export interface HeadingProps {
    level: number
    className?: string
}

export const InvalidHeadingLevelError = error("InvalidHeadingLevelError")

export const Heading: FunctionalComponent<HeadingProps> = ({
    level,
    children,
    className
}) => {
    if (level <= 3 && level > 0) {
        let textSize

        if (level === 1) {
            textSize = "text-4xl"
        } else if (level === 2) {
            textSize = "text-3xl"
        } else if (level === 3) {
            textSize = "text-2l"
        }

        return h(
            `h${level}`,
            {
                className: `${textSize} font-bold mb-2 ${
                    className ? className : ""
                }`
            },
            children
        )
    } else {
        throw new InvalidHeadingLevelError(
            `${level} is not a valid heading level. Heading levels must be between 1 and 3 (inclusive).`
        )
    }
}

export const H1: FunctionalComponent<{ className?: string }> = ({
    children,
    className
}) => (
    <Heading level={1} className={className}>
        {children}
    </Heading>
)
