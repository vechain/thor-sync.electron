
declare interface SignTx {
    signTx(
        contentsId: number,
        message: Connex.Vendor.SigningService.TxMessage,
        options: SignTx.Options,
        referer: {
            url: string
            title: string
        }
    ): Promise<Connex.Vendor.SigningService.TxResponse>
}

declare namespace SignTx {
    type Options = {
        signer?: string
        gas?: number
        link?: string
        comment?: string
    }
}
