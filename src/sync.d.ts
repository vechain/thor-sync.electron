
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
            message: Connex.Vendor.SigningService.TxMessage
            comment: string
            timestamp: number
            signer: string
            estimatedFee: string
            link: string
            raw: string
            receipt: Connex.Thor.Receipt | null
        }

        type Cert = {
            message: Connex.Vendor.SigningService.CertMessage
            signer: string
            timestamp: number
            domain: string
            signature: string
        }
    }

    type Preference = {
        id?: number
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

interface Client {
    readonly genesis: Connex.Thor.Block
    readonly head: Connex.Thor.Status['head']
    readonly progress: number

    nextTick(): Promise<void>

    explain(clauses: Connex.Thor.Clause[], options: {
        caller?: string
        gas?: number
        gasPrice?: string
    }, rev: string): Promise<Connex.Thor.VMOutput[]>

    getAccount(addr: string, rev: string): Promise<Connex.Thor.Account>
    getCode(addr: string, rev: string): Promise<Connex.Thor.Code>
    getStorage(addr: string, key: string, rev: string): Promise<Connex.Thor.Storage>
    call(
        clause: Connex.Thor.Clause,
        options: {
            caller?: string
            gas?: number
            gasPrice?: string
        }, rev: string): Promise<Connex.Thor.VMOutput>

    getBlock(rev: string | number): Promise<Connex.Thor.Block | null>
    getTx(id: string): Promise<Connex.Thor.Transaction | null>
    getReceipt(id: string): Promise<Connex.Thor.Receipt | null>
    filter<T extends 'event' | 'transfer'>(kind: T, body: {
        range: Connex.Thor.Filter.Range
        order: 'asc' | 'desc'
        criteriaSet: Connex.Thor.Filter.Criteria<T>[]
        options: { offset: number, limit: number }
    }): Promise<Connex.Thor.Filter.Result<T>>

    txer: {
        send(id: string, raw: string): void
        status(id: string): 'sending' | 'sent' | 'error' | undefined
    }
    discoverNode(url: string): Promise<Connex.Thor.Block>
}


type SignTxOptions = {
    signer?: string
    gas?: number
    link?: string
    comment?: string
}

type SignCertOptions = {
    signer?: string
}

type SignTxArg = {
    message: Connex.Vendor.SigningService.TxMessage,
    options: SignTxOptions,
    referer: Referer
}

type SignCertArg = {
    message: Connex.Vendor.SigningService.CertMessage,
    options: SignCertOptions,
    referer: Referer
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
