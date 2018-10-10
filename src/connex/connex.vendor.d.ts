declare namespace Connex {
    interface Vendor {
        readonly name: string

        sign<T extends 'tx'>(
            kind: T,
            message: Connex.Thor.Clause[],
            options?: Vendor.Options<T>
        ): Promise<Vendor.Signed<T>>
    }

    namespace Vendor {
        type Options<T> = {
            origin?: string
            valueRange?: { atLeast: string, atMost?: string }
        }
        type Signed<T> = {
            message: string
            signer: string
        }
    }
}
