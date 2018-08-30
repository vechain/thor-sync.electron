
declare interface Connex {
    readonly user: Connex.User
    readonly thor: Connex.Thor
    readonly toolkit: Connex.Toolkit
}

declare namespace Connex {
    export interface User {
        readonly address: string
        sign(clauses: Thor.Clause[]): Promise<string>
    }

    export interface Thor {
        readonly genesis: string

        account(addr: string, revision?: string | number): Thor.AccountVisitor
        block(revision: string | number): Thor.BlockVisitor
        tx(id: string, head?: string): Thor.TransactionVisitor
        log<T extends Thor.Log.Kind>(
            kind: T, criteria: Array<Thor.Log.Criteria<T>>): Thor.LogVisitor<T>

        subscribe<T extends Thor.Subscription.Subject>(
            subject: T, criteria: Thor.Subscription.Criteria<T>): Thor.Subscription<T>

        exec(clause: Thor.Clause): Promise<Thor.ExecutionOutput>
        commit(rawTx: string): Promise<Thor.TransactionVisitor>
    }

    export namespace Thor {
        export interface AccountVisitor {
            readonly address: string
            readonly revision: string | number | undefined
            get(): Promise<Account>
            exec(clause: Clause): Promise<ExecutionOutput>
        }

        export interface BlockVisitor {
            readonly revision: string | number
            get(): Promise<Block & { isTrunk: boolean }>
        }

        export interface TransactionVisitor {
            readonly id: string
            readonly head: string | undefined
            get(): Promise<(Transaction & { meta: Transaction.Meta }) | null>
            receipt(): Promise<(Receipt & { meta: Transaction.Meta }) | null>
        }

        export interface LogVisitor<T extends Log.Kind> {
            readonly kind: Log.Kind
            range(unit: 'block' | 'time', from: number, to: number): LogVisitor<T>
            order(o: 'asc' | 'desc'): LogVisitor<T>
            limit(offset: number, limit: number): LogVisitor<T>
            get(): Promise<Array<Log<T>>>
        }

        export interface Subscription<T extends Subscription.Subject> {
            readonly subject: Subscription.Subject
            next(): Promise<Subscription.Message<T>>
            unsubscribe(): void
        }

        ///////
        export type Account = {
            balance: string
            energy: string
            hasCode: boolean
        }

        export type Block = {
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

        export type Clause = {
            to: string
            value: string
            data: string
        }

        export type Transaction = {
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
        export namespace Transaction {
            export type Meta = {
                blockID: string
                blockNumber: number
                blockTimestamp: number
            }
        }

        export type Receipt = {
            gasUsed: number
            gasPayer: string
            paid: string
            reward: string
            reverted: boolean
            outputs: Receipt.Output[]
        }

        export namespace Receipt {
            export type Output = {
                contractAddress: string | null
                events: Event[]
                transfers: Transfer[]
            }
        }

        export type Event = {
            address: string
            topics: string[]
            data: string
        }

        export namespace Event {
            export type Criteria = {
                topic0?: string
                topic1?: string
                topic2?: string
                topic3?: string
                topic4?: string
            }
        }

        export type Transfer = {
            sender: string
            recipient: string
            amount: string
        }

        export namespace Transfer {
            export type Criteria = {
                txOrigin?: string
                sender?: string
                recipient?: string
            }
        }

        export type Log<T extends Log.Kind> =
            (T extends 'event' ? Event : Transfer) & { meta: Log.Meta }

        export namespace Log {
            export type Kind = 'event' | 'transfer'
            export type Meta = {
                blockID: string
                blockNumber: number
                blockTimestamp: number
                txID: string
                txOrigin: string
            }
            export type Criteria<T extends Kind> =
                T extends 'event' ? Event.Criteria : Transfer.Criteria
        }
        export namespace Subscription {
            export type Subject = 'event' | 'transfer' | 'block'
            export type Criteria<T extends Subject> =
                (T extends Log.Kind ? Log.Criteria<T> : {}) & { position?: string }
            export type Message<T extends Subject> =
                (T extends Log.Kind ? Log<T> : Block) & { obsolete: boolean }
        }

        export type ExecutionOutput = {
            gasUsed: number
            reverted: boolean
            data: string
            vmError: string
            events: Event[]
            transfers: Transfer[]
        }
    }

    export interface Toolkit {
    }

    export namespace Toolkit {
    }
}
