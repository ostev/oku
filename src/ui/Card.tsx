import { FunctionalComponent } from "preact"
import { Heading } from "./Heading"

export interface CardProps {
    title: string
}

export const Card: FunctionalComponent<CardProps> = ({ children, title }) => {
    return (
        <div class="rounded overflow-hidden shadow-lg backdrop-blur-sm">
            <Heading level={1}>{title}</Heading>
            {children}
        </div>
    )
}
