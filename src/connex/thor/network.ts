declare interface NetworkInterface {
    readonly genesis: Connex.Thor.Block
    readonly best: Connex.Thor.Block
    nextTick(): Promise<void>
}
