import 'electron'

declare module 'electron' {
    interface App {
        vendor: {
            [windowId: number]: VendorInterface
        }
    }
}
