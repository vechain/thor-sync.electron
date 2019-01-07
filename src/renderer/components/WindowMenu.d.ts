declare namespace WindowMenu {
    interface Item {
        label: string
        keys: string[]
        action: () => void
        invisible?: boolean
        divider?: boolean
        disabled?: boolean
    }
}
