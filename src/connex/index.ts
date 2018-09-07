import * as Thor from './thor'

export function create(options: {
    userAddr: string,
    genesis: string,
    apiBaseURL: string,
    signer: Connex.User['sign']
}): Connex {

    const thor = Thor.create(options.apiBaseURL, options.genesis)
    const user = {
        get address() { return options.userAddr },
        sign<T extends 'tx'>(
            target: T,
            clauses: Connex.Thor.Clause[]
        ): Promise<string> {
            return {} as any
        }
    }
    const toolkit = {}
    return {
        get user() { return user },
        get thor() { return thor },
        get toolkit() { return toolkit }
    }
}
