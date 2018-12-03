
interface SignTx {
    signTx(
        contentsId: number,
        message: Connex.Vendor.SigningService.Message<'tx'>,
        options: Connex.Vendor.SigningService.Options<'tx'>,
        referer: {
            url: string
            title: string
        }
    ): Promise<Connex.Vendor.SigningService.Result<'tx'>>
}
