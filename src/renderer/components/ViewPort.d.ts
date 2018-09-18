declare namespace ViewPort {
    type DataUpdateEvent = {
        type: string | 'title' | 'icon' | 'url' | 'new-window',
        value: string
    }

    type StatusUpdateEvent = {
        status: string
    }
}
