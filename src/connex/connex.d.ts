declare interface Connex {
    readonly user?: Connex.User
    readonly thor: Connex.Thor
    readonly vendor: Connex.Vendor
}

declare namespace Connex {
    interface User {
        readonly address: string
        sign<T extends 'tx'>(kind: T, clauses: Thor.Clause[]): Promise<string>
    }

    interface Thor {
        readonly genesis: Thor.Block
        readonly status: Thor.Status

        nextTick(): Promise<void>

        account(
            addr: string,
            revision?: string | number
        ): Thor.AccountVisitor

        block(
            revision: string | number
        ): Thor.BlockVisitor

        transaction(
            id: string,
            head?: string
        ): Thor.TransactionVisitor

        filter<T extends 'event' | 'transfer'>(
            kind: T,
            criteriaSet: Array<Thor.Criteria<T>>
        ): Thor.Filter<T>

        subscribe<T extends 'event' | 'transfer' | 'block'>(
            subject: T,
            criteria: Thor.Criteria<T>
        ): Thor.Subscription<T>

        call(
            input: Thor.VMInput,
            revision?: string | number
        ): Promise<Thor.VMOutput>

        commit(
            rawTx: string
        ): Promise<Thor.TransactionVisitor>
    }

    namespace Thor {
        interface AccountVisitor {
            readonly address: string
            readonly revision: string | number | undefined
            get(): Promise<Account>
            code(): Promise<string>
            storage(key: string): Promise<string>
            call(input: VMInput): Promise<VMOutput>
            method(abi: object): MethodVisitor
            event(abi: object): EventVisitor
        }

        interface MethodVisitor {
            asClause(
                args: any[],
                value?: string | number): Clause
            call(
                args: any[],
                options?: VMOptions
            ): Promise<DecodedVMOutput>
        }

        interface EventVisitor {
            asCriteria(indexed: object): Event.Criteria
            filter(indexed: object[]): Filter<'decoded-event'>
            subscribe(indexed: object): Subscription<'decoded-event'>
        }

        interface BlockVisitor {
            readonly revision: string | number
            get(): Promise<(Block & { isTrunk: boolean }) | null>
        }

        interface TransactionVisitor {
            readonly id: string
            readonly head: string | undefined
            get(): Promise<(Transaction & { meta: Transaction.Meta }) | null>
            receipt(): Promise<(Receipt & { meta: Transaction.Meta }) | null>
        }

        interface Filter<T extends 'event' | 'transfer' | 'decoded-event'> {
            readonly kind: T
            range(unit: 'block' | 'time', from: number, to: number): Filter<T>
            order(order: 'asc' | 'desc'): Filter<T>
            offset(offset: number): Filter<T>
            next(limit: number): Promise<Log<T>[]>
        }

        interface Subscription<T extends 'event' | 'block' | 'transfer' | 'decoded-event'> {
            readonly subject: T
            next(): Promise<Subscription.Message<T>>
            unsubscribe(): void
        }
    }
    namespace Thor {
        ///////
        type Status = {
            readonly progress: number
            readonly id: string
            readonly timestamp: number
            readonly number: number
        }

        type Account = {
            balance: string
            energy: string
            hasCode: boolean
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

        type Clause = {
            to: string
            value: string
            data: string
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
                blockID: string
                blockNumber: number
                blockTimestamp: number
            }
        }

        type Receipt = {
            gasUsed: number
            gasPayer: string
            paid: string
            reward: string
            reverted: boolean
            outputs: Receipt.Output[]
        }

        namespace Receipt {
            type Output = {
                contractAddress: string | null
                events: Event[]
                transfers: Transfer[]
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

        type DecodedEvent = {
            decoded: object
        } & Event


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
            { position?: string } &
            (T extends 'event' ? Event.Criteria :
                T extends 'transfer' ? Transfer.Criteria : {})

        type Log<T extends 'event' | 'transfer' | 'decoded-event'> =
            { meta: Log.Meta } & (
                T extends 'event' ? Event :
                T extends 'transfer' ? Transfer : DecodedEvent)

        namespace Log {
            type Meta = {
                blockID: string
                blockNumber: number
                blockTimestamp: number
                txID: string
                txOrigin: string
            }
        }
        namespace Subscription {
            type Message<T extends 'block' | 'event' | 'transfer' | 'decoded-event'> =
                { obsolete: boolean } & (
                    T extends 'block' ? Block :
                    T extends 'event' ? Event :
                    T extends 'transfer' ? Transfer : DecodedEvent)
        }
        type VMOptions = {
            value?: string
            gas?: number
            gasPrice?: string
            caller?: string
        }

        type VMInput = {
            data?: string
        } & VMOptions

        type VMOutput = {
            data: string
            vmError: string
            gasUsed: number
            reverted: boolean
            events: Event[]
            transfers: Transfer[]
        }

        type DecodedVMOutput = {
            decoded: object
        } & VMOutput
    }

    interface Vendor {
        name: string
    }
}
