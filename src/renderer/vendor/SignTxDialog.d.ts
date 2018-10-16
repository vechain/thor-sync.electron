
interface SignTx {
    signTx(
        clientId: string[],
        message: Connex.Vendor.Message<'tx'>,
        options?: Connex.Vendor.SignOptions<'tx'>
    ): Promise<Connex.Vendor.SignResult<'tx'>>
}
