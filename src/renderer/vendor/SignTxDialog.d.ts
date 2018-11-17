
interface SignTx {
    signTx(
        contentsId: number,
        message: Connex.Vendor.Message<'tx'>,
        options: Connex.Vendor.SignOptions<'tx'>,
        referer : {
            url: string
            title: string
        }
    ): Promise<Connex.Vendor.SignResult<'tx'>>
}
