import { Vue } from 'vue-property-decorator'
import { Address, Num } from '@/common/formatter'

function isRegExpArray(v: any): v is RegExpMatchArray {
    return v !== null && v instanceof Array
}

function removeZero(str: string) {
    const temp = str
        .split('')
        .reverse()
        .join('')
        .match(/[1-9]/)
    if (isRegExpArray(temp)) {
        return str.slice(0, str.length - (temp.index || 0))
    } else {
        return str
    }
}

Vue.filter('balance', (value: string, decimal: number) => {
    return Num.formatBalance(value, decimal)
})

Vue.filter('shortAddr', (addr: string) => {
    return Address.abbrev(Address.toChecksum(addr)!)
})

Vue.filter('shortTxHas', (txId: string) => {
    return txId.slice(0, 8) + '…' + txId.slice(txId.length - 9)
})
Vue.filter('date', (val: number) => {
    const date = new Date(val * 10e2)
    return date.toLocaleString('en-GB', {
        // formatMatcher: 'year, month, day',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    })
})

Vue.filter('dateTime', (val: number) => {
    const date = new Date(val * 10e2)
    return date.toLocaleString('en-GB')
})
