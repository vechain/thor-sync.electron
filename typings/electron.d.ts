import { } from 'electron'

declare module 'electron' {
    interface WebContents {
        getWebPreferences(): WebPreferences
    }

    interface WebPreferences {
        'xargs.clientId'?: string
        'xargs.config'?: Connex.Thor.Site.Config
    }
}
