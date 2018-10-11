declare namespace TabBar {
    type Item = {
        id? : number
        title: string
        iconUrl: string
        src: string
        status: string | 'loading' | 'loadend' | 'failed' | 'new'
    }
}
