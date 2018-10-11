import { } from 'electron'

declare module 'electron' {
    interface WebContents {
        getWebPreferences(): WebPreferences
    }

    interface WebPreferences {
        preloadURL?: string
        xargs?: {
            clientId?: string[]
            config?: Connex.Thor.Site.Config
        }
    }
}
