declare namespace WebView {
    type Status = {
        title: string
        favicon: string
        progress: number
        canGoBack: boolean
        canGoForward: boolean
        cert: Electron.CertificateVerifyProcRequest | null
    }

    type Nav = {
        goBack: number
        goForward: number
        reload : number
        reloadIgnoringCache: number
        stop: number
        reGo: number
    }
}