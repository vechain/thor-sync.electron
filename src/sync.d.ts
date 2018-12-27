
type NodeConfig = {
    name: string
    url: string
    genesis: Connex.Thor.Block
}

type Referer = {
    url: string
    title: string
}

declare interface VendorInterface {
    signTx(
        contentsId: number,
        message: Connex.Vendor.SigningService.TxMessage,
        options: VendorInterface.SignTxOptions,
        referer: Referer
    ): Promise<Connex.Vendor.SigningService.TxResponse>

    signCert(
        contentsId: number,
        message: Connex.Vendor.SigningService.CertMessage,
        options: VendorInterface.SignCertOptions,
        referer: Referer
    ): Promise<Connex.Vendor.SigningService.CertResponse>
}

declare namespace VendorInterface {
    type SignTxOptions = {
        signer?: string
        gas?: number
        link?: string
        comment?: string
    }

    type SignCertOptions = {
        signer?: string
    }
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

    interface Preference {
        id: number
        key: string
        value: any
    }

    type Shortcut = {
        id: number
        title: string
        href: string
    }

    type Node = {
        id: number
    } & NodeConfig

    interface AccessRecord {
        id: number
        baseUrl: string
    }

    interface Wallet {
        id?: number
        address: string
        name: string
        keystore: Keystore
        createdTime: number
    }
}
