declare namespace TabBar {
    type Item = {
        title: string
        iconUrl: string
        src: string
        status: string | 'loading' | 'loadend' | 'failed' | 'new'
    }
}
