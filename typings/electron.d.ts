import 'electron'

declare module 'electron' {
    interface WebContents {
        getWebPreferences(): WebPreferences
    }

    interface WebPreferences {
        preloadURL?: string
        nodeConfig?: NodeConfig
    }
}
