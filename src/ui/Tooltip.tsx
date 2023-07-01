import { ComponentChild, FunctionComponent, FunctionalComponent } from "preact"
import { MutableRef, useRef, useState } from "preact/hooks"

import "./tooltip.css"

export const Tooltip: FunctionalComponent<{ content: ComponentChild }> = ({
    children,
    content,
}) => {
    // const [isVisible, setIsVisible] = useState(false)
    // const [position, setPosition] = useState({ top: 0, left: 0 })

    const ref: MutableRef<HTMLSpanElement | null> = useRef(null)

    // const style = {
    //     display: isVisible ? "inline-block" : "none",
    //     top: "-1em",
    //     // left: position.left,
    // }

    // const updatePosition = () => {
    //     if (ref.current !== null) {
    //         const bounds = ref.current.getBoundingClientRect()
    //         setPosition({ top: bounds.top, left: bounds.left })
    //     }
    // }

    // console.log(position)

    return (
        <span class="tooltip" ref={ref}>
            {children}
            <span class=" z-40 bg-slate-100 tooltip-text p-2 drop-shadow-md backdrop-blur-xl rounded-lg">
                {content}
            </span>
        </span>
    )
}
