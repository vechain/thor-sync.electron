declare namespace Connex {
    interface User {
        readonly address: string
        sign<T extends 'tx'>(
            kind: T,
            payload: Thor.Clause[]
        ): Promise<string>
    }
}
