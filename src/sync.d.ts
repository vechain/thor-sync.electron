
type NodeConfig = {
    name: string
    url: string
    genesis: Connex.Thor.Block
}

type Referer = {
    url: string
    title: string
}

type Keystore = {
    address: string;
    crypto: object;
    id: string;
    version: number;
}

declare namespace entities {
    type Activity<T extends 'tx' | 'cert'> = {
        id?: number
        type: T
        createdTime: number
        referer: Referer
        closed: number
        data:
        T extends 'tx' ? Activity.Tx :
        T extends 'cert' ? Activity.Cert : never
    }

    namespace Activity {
        type Tx = {
            id: string
            message: Connex.Vendor.TxMessage
            comment: string
            timestamp: number
            signer: string
            estimatedFee: string
            link: string
            raw: string
            receipt: Connex.Thor.Receipt | null
        }

        type Cert = {
            id: string
            message: Connex.Vendor.CertMessage
            signer: string
            timestamp: number
            domain: string
            signature: string
            link: string
        }
    }

    type AppHubItem = {
        name: string
        href: string
        desc: string
        tags: string[]
        id: string
        createAt: number
    }

    type Preference = {
        key: string
        value: any
    }

    type Shortcut = {
        id?: number
        title: string
        href: string
    }

    type Node = {
        id?: number
    } & NodeConfig

    type AccessRecord = {
        id?: number
        baseUrl: string
        lastAccessTime: number
        tokens: string[]
        accessCount: number
        pages: {
            title: string
            href: string
            favicon: string
            accessCount: number
        }[]
    }

    type LedgerDevice = {
        id?: number
        publicKey: string
        chainCode: string
        name: string
        createdTime?: number
        product: string
    }

    type Wallet = {
        id?: number
        address: string
        name: string
        keystore: Keystore
        createdTime: number
    }
}

type DbEvent = {
    db: string
    table: string
    changes: Array<'creating' | 'updating' | 'deleting'>
}

// MQ payloads
type WindowAction = {
    windowId: number
    action: 'maximize' | 'unmaximize' | 'minimize'
}

type TabAction = {
    action: 'close' | 'new'
    url?: string
}

type WebStatus = {
    title: string
    favicon: string
    progress: number
    cert: Electron.ProcRequest | null
    committed: boolean
    domReady: boolean
    canGoForward: boolean
    canGoBack: boolean
}

type WebAction = {
    goBack: number
    goForward: number
    reload: number
    reloadIgnoringCache: number
    stop: number
    reGo: number

    zoomIn: number
    zoomOut: number
    zoomReset: number

    suspend: 'normal' | 'strip' | null
}
