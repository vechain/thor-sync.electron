declare namespace Connex {
    interface Thor {
        readonly genesis: Thor.Block
        readonly status: Thor.Status

        ticker(): Thor.Ticker

        account(addr: string, options?: { revision?: string | number }): Thor.AccountVisitor
        block(revision: string | number): Thor.BlockVisitor
        transaction(id: string, options?: { head?: string }): Thor.TransactionVisitor
        filter<T extends 'event' | 'transfer'>(kind: T, criteriaSet: Array<Thor.Criteria<T>>): Thor.Filter<T>
        subscribe<T extends 'event' | 'transfer' | 'block'>
            (subject: T, criteria: Thor.Criteria<T>, options?: { position?: string }): Thor.Subscription<T>

        explain(clauses: Thor.Clause[], options?: Thor.CallOptions & { revision?: string | number }): Promise<Thor.VMOutput[]>
    }

    namespace Thor {
        type Status = {
            progress: number
            head: {
                id: string
                number: number
                timestamp: number
            }
        }

        interface Ticker {
            next(): Promise<void>
        }

        interface BlockVisitor {
            readonly revision: string | number
            get(): Promise<(Block & TrunkFlag) | null>
        }

        type Block = {
            id: string
            number: number
            size: number
            parentID: string
            timestamp: number
            gasLimit: number
            beneficiary: string
            gasUsed: number
            totalScore: number
            txsRoot: string
            stateRoot: string
            receiptsRoot: string
            signer: string
            transactions: string[]
        }

        interface AccountVisitor {
            readonly address: string
            get(): Promise<Account>
            getCode(): Promise<Account.Code>
            getStorage(key: string): Promise<Account.Storage>

            method(abi: object): Method
            event(abi: object): EventVisitor
        }

        type Account = {
            balance: string
            energy: string
            hasCode: boolean
        }

        namespace Account {
            type Storage = {
                value: string
            }
            type Code = {
                code: string
            }
        }

        interface Method {
            asClause(args: any[], value: string | number): Clause
            call(args: any[], value: string | number, options?: CallOptions): Promise<VMOutput & Decoded>
        }

        interface EventVisitor {
            asCriteria(indexed: object): Event.Criteria
            filter(indexed: object[]): Filter<'decoded-event'>
            subscribe(indexed: object, options?: { position?: string }): Subscription<'decoded-event'>
        }

        interface TransactionVisitor {
            readonly id: string
            readonly head: string | undefined
            get(): Promise<(Transaction & Transaction.Meta) | null>
            getReceipt(): Promise<(Receipt & Transaction.Meta) | null>
        }

        type Transaction = {
            id: string
            chainTag: number
            blockRef: string
            expiration: number
            clauses: Clause[]
            gasPriceCoef: number
            gas: number
            origin: string
            nonce: string
            dependsOn: string | null
            size: number
        }

        namespace Transaction {
            type Meta = {
                meta: {
                    blockID: string
                    blockNumber: number
                    blockTimestamp: number
                }
            }
        }

        type Receipt = {
            gasUsed: number
            gasPayer: string
            paid: string
            reward: string
            reverted: boolean
            outputs: {
                contractAddress: string | null
                events: Event[]
                transfers: Transfer[]
            }[]
        }

        type Clause = {
            to: string | null
            value: string | number
            data: string
        }

        interface Filter<T extends 'event' | 'transfer' | 'decoded-event'> {
            readonly kind: T
            range(range: Range): this
            order(order: 'asc' | 'desc'): this
            next(offset: number, limit: number): Promise<Array<Log<T>>>
        }

        type Log<T extends 'event' | 'transfer' | 'decoded-event'> = (
            T extends 'event' ? Event :
            T extends 'transfer' ? Transfer : (Event & Decoded)) & Log.Meta

        namespace Log {
            type Meta = {
                meta: {
                    blockID: string
                    blockNumber: number
                    blockTimestamp: number
                    txID: string
                    txOrigin: string
                }
            }
        }

        type Event = {
            address: string
            topics: string[]
            data: string
        }

        namespace Event {
            type Criteria = {
                address?: string
                topic0?: string
                topic1?: string
                topic2?: string
                topic3?: string
                topic4?: string
            }
        }

        type Transfer = {
            sender: string
            recipient: string
            amount: string
        }

        namespace Transfer {
            type Criteria = {
                txOrigin?: string
                sender?: string
                recipient?: string
            }
        }

        type Criteria<T extends 'event' | 'transfer' | 'block'> =
            T extends 'event' ? Event.Criteria :
            T extends 'transfer' ? Transfer.Criteria : {}

        type Range = {
            unit: 'block' | 'time'
            from: number
            to: number
        }

        interface Subscription<T extends 'event' | 'block' | 'transfer' | 'decoded-event'> {
            readonly subject: T
            next(): Promise<Subscription.Message<T>>
            unsubscribe(): void
        }

        namespace Subscription {
            type Message<T extends 'block' | 'event' | 'transfer' | 'decoded-event'> = (
                T extends 'block' ? Block :
                T extends 'event' ? (Event & Log.Meta) :
                T extends 'transfer' ? (Transfer & Log.Meta) :
                (Event & Decoded & Log.Meta)) & ObsoleteFlag
        }

        type ObsoleteFlag = {
            obsolete: boolean
        }

        type TrunkFlag = {
            isTrunk: boolean
        }

        type CallOptions = {
            gas?: number
            gasPrice?: string
            caller?: string
        }


        type VMOutput = {
            data: string
            vmError: string
            gasUsed: number
            reverted: boolean
            events: Event[]
            transfers: Transfer[]
        }

        type Decoded = {
            decoded: object
        }
    }
}
