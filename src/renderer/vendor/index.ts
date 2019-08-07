import Vendor from './Vendor.vue'

export default Vendor

declare global {
    interface Window {
        VENDOR: {
            signTx(
                msg: Connex.Driver.SignTxArg,
                option: Connex.Driver.SignTxOption,
                caller: {
                    referer: Referer
                    webContentsId: number
                }
            ): Promise<Connex.Driver.SignTxResult>
            signCert(
                msg: Connex.Driver.SignCertArg,
                option: Connex.Driver.SignCertOption,
                caller: {
                    referer: Referer
                    webContentsId: number
                }
            ): Promise<Connex.Driver.SignCertResult>
            isAddressOwned(addr: string): boolean
        }
    }
}
