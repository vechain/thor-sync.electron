declare interface Connex {
    readonly thor: Connex.Thor
    readonly vendor: Connex.Vendor
}

declare namespace Connex {
    type Error = 'SignRejected'
}
