declare namespace Connex {
    interface Vendor {
        readonly name: string

        sign<T extends 'tx'>(
            kind: T,
            message: Vendor.Message<T>,
            options?: Vendor.SignOptions<T>
        ): Promise<Vendor.SignResult<T>>
    }

    namespace Vendor {
        type Message<T extends 'tx'> = T extends 'tx' ?
            Vendor.Clause[] : never

        type SignOptions<T extends 'tx'> = T extends 'tx' ? {
            signer?: string
            gas?: number
        } : never

        type SignResult<T extends 'tx'> = T extends 'tx' ? {
            txId: string
            signer: string
        } : never

        type Clause = {
            to: string | null
            value?: string | number
            data?: string

            // options
            desc?: string
        }
    }
}
