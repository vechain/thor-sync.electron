import { } from 'electron'

declare module 'electron' {
    interface WebContents {
        getWebPreferences(): WebPreferences
    }

    interface WebPreferences {
        preloadURL?: string
        siteConfig?: Connex.Thor.Site.Config
    }
}
