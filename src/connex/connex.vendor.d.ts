declare namespace Connex {
    interface Vendor {
        readonly name: string

        sign<T extends 'tx'>(
            kind: T,
            message: Vendor.Message<T>,
            options?: Vendor.SignOptions<T>
        ): Promise<Vendor.Signed<T>>
    }

    namespace Vendor {
        type Message<T extends 'tx'> = T extends 'tx' ?
            Vendor.Clause[] : never

        type SignOptions<T extends 'tx'> = T extends 'tx' ? {
            origin?: string | { address: string, required?: boolean }
        } : never

        type Signed<T extends 'tx'> = T extends 'tx' ? {
            message: string
            signer: string
        } : never

        type Clause = {
            to: string | null
            value: string | number
            data?: string

            // options
            desc?: string
        }
    }
}
