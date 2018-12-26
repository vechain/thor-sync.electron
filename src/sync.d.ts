
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
