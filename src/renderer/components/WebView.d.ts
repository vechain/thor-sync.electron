declare namespace WebView {
    type Status = {
        title: string
        favicon: string
        progress: number
        canGoBack: boolean
        canGoForward: boolean
    }

    type Nav = {
        goBack: number
        goForward: number
        reloadOrStop: number
    }
}