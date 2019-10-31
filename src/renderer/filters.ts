import { Vue } from 'vue-property-decorator'
import { Address, Num } from '@/common/formatter'
import { cry } from 'thor-devkit'
import * as NodeUrl from 'url'
import Color from 'color'
import { hostnameOf } from '@/common/url-utils'

function isRegExpArray(v: any): v is RegExpMatchArray {
    return v !== null && v instanceof Array
}

function hash(str: string) {
    if (str.length === 0) {
        return 0
    }
    let h = 0
    for (let i = 0; i < str.length; i++) {
        h = h * 31 + str.charCodeAt(i)
        h = h % 2 ** 32
    }
    return h
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

Vue.filter('hostnameOf', (value: string) => {
    return hostnameOf(value)
})

Vue.filter('balance', (value: string, decimal: number) => {
    return Num.formatBalance(value, decimal)
})

Vue.filter('shortAddr', (addr: string) => {
    return Address.abbrev(Address.toChecksum(addr)!)
})

Vue.filter('shortTxId', (txId: string) => {
    return txId.slice(0, 8) + '…' + txId.slice(txId.length - 9)
})

Vue.filter('dateTime', (val: number) => {
    const date = new Date(val)
    return date.toLocaleString()
})

Vue.filter('checksum', (val: string) => {
    try {
        return cry.toChecksumAddress(val)
    } catch (err) {
        return err.toString()
    }
})

Vue.filter('ledgerName', (val: string, index: string) => {
    return val + ' - ' + (parseInt(index, 10) + 1)
})

Vue.filter('faceColor', (href: string) => {
    const colors = [
        '#e91e63',
        '#9c27b0',
        '#673ab7',
        '#3f51b5',
        '#2196f3',
        '#03a9f4',
        '#00bcd4',
        '#009688',
        '#4caf50',
        '#8bc34a',
        '#cddc39',
        '#ff9800',
        '#ff5722'
    ]
    const url = NodeUrl.parse(href || '')

    const i1 = hash(url.host || '') % colors.length
    let i2 = hash(url.pathname || '') % colors.length
    if (i1 === i2) {
        i2 = (i2 + 1) % colors.length
    }
    const c1 = colors[i1]
    const c2 = colors[i2]

    return Color(c1)
        .mix(Color(c2), 0.4)
        .saturate(0.1)
        .hex()
})
