declare namespace ViewPort {
    type DataUpdateEvent = {
        type: string, // | 'title' | 'icon' | 'url' | 'new-window',
        value: string | number
    }

    type StatusUpdateEvent = {
        status: string
    }

    type Opt = {
        src: string
    }
}
