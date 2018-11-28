
// see https://github.com/danfinlay/jazzicon
import MersenneTwister from 'mersenne-twister'
import Color from 'color'

const allColors = [
    '#f44336',
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
    '#ffc107',
    '#ff9800',
    '#ff5722'
]

function hash(str: string) {
    if (str.length === 0) {
        return 0
    }
    let h = 0
    for (let i = 0; i < str.length; i++) {
        h = h * 31 + str.charCodeAt(i)
        h = h % (2 ** 32)
    }
    return h
}

export function generate(content: string) {
    const seed = hash(content)
    const rand = new MersenneTwister(seed)

    const colors = allColors.map(hex => {
        const color = Color(hex).darken(0.2)
        return color.hex()
    })

    const genColor = () => {
        const idx = Math.floor(colors.length * rand.random())
        return colors.splice(idx, 1)[0]
    }

    const bgStr = `<rect fill="${genColor()}" width="100" height="100"/>`
    let shapesStr = ''
    const layers = 3
    const rs = [35, 40, 45, 50, 55, 60]
    const cxs = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
    const cys = [30, 40, 50, 60, 70]

    for (let i = 0; i < layers; i++) {
        const r = rs.splice(Math.floor(rs.length * rand.random()), 1)[0]
        const cx = cxs.splice(Math.floor(cxs.length * rand.random()), 1)[0]
        const cy = cys.splice(Math.floor(cys.length * rand.random()), 1)[0]
        const fill = genColor()

        shapesStr += `<circle r="${r}" cx="${cx}" cy="${cy}" fill="${fill}" opacity="0.5"/>`
    }
    return `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${bgStr}${shapesStr}</svg>`
}
