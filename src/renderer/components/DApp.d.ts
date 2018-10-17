declare namespace Dapp{
    type Route = {
        name: string
    }
    type Item = {
        name: string
        src: string | Route
        newTab: boolean
    }
}
