import * as NodeUrl from 'url'

const knownProtocols = [
    'http:',
    'https:',
    'file:',
    'sync:'
]

export function formalize(input: string, fallbackSearchEngine?: 'duckduckgo' | 'google' | 'bing') {
    if (!input) {
        return ''
    }
    let url = NodeUrl.parse(input)
    if (url.protocol && knownProtocols.indexOf(url.protocol) >= 0) {
        if (url.path || url.host) {
            return NodeUrl.format(url)
        }
        return search(input, fallbackSearchEngine)
    }

    url = NodeUrl.parse('http://' + input)
    if (/^[a-z0-9]{1,61}(?:\.[a-z]{2,})+$/i.test(url.hostname || '')) {
        return NodeUrl.format(url)
    }
    return search(input, fallbackSearchEngine)
}

export function hostOf(url: string) {
    return NodeUrl.parse(url).host || ''
}

export function hostnameOf(url: string) {
    return NodeUrl.parse(url).hostname || ''
}

export function search(q: string, se?: 'duckduckgo' | 'google' | 'bing') {
    const encodedQ = encodeURIComponent(q)
    if (se === 'google') {
        return `https://www.google.com/search?q=${encodedQ}`
    } else if (se === 'bing') {
        return `https://bing.com/search?q=${encodedQ}`
    } else {
        return `https://duckduckgo.com/?q=${encodedQ}`
    }
}

export function prettyForDisplay(url: string) {
    const host = hostOf(url)
    if (!host) {
        return ''
    }
    if (host.startsWith('www.')) {
        return host.slice(4)
    }
    return host
}

export function filePathToUrl(path: string) {
    // WHATWG URL
    try {
        return new NodeUrl.URL(`file:///${path}`).href
    } catch (err) {
        return ''
    }
}

export function baseUrlOf(href: string) {
    try {
        return new NodeUrl.URL(href).origin
    } catch (err) {
        return ''
    }
}

export function hasPath(href: string) {
    const pathname = NodeUrl.parse(href).pathname
    return pathname && pathname !== '/'
}

