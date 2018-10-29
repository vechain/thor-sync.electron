
// see https://github.com/danfinlay/jazzicon
import MersenneTwister from 'mersenne-twister'
import Color from 'color'

const colors = [
    '#01888C', // teal
    '#FC7500', // bright orange
    '#034F5D', // dark teal
    '#F73F01', // orangered
    '#FC1960', // magenta
    '#C7144C', // raspberry
    '#F3C100', // goldenrod
    '#1598F2', // lightning blue
    '#2465E1', // sail blue
    '#F19E02', // gold
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
    const wobble = 20
    const amount = (rand.random() * wobble) - (wobble / 2)
    const remainingColors = colors.map(hex => {
        const color = Color(hex).rotate(amount).desaturate(0.3).darken(0.1)
        return color.hex()
    })

    const genColor = () => {
        const idx = Math.floor(remainingColors.length * rand.random())
        return remainingColors.splice(idx, 1)[0]
    }

    const bgStr = `<rect fill="${genColor()}" width="100" height="100"/>`
    let shapesStr = ''
    const layers = 3
    for (let i = 0; i < layers; i++) {
        const firstRot = rand.random()
        const angle = Math.PI * 2 * firstRot
        const velocity = 100 / layers * rand.random() + (i * 100 / layers)
        const tx = (Math.cos(angle) * velocity)
        const ty = (Math.sin(angle) * velocity)
        const secondRot = rand.random()
        const rot = (firstRot * 360) + secondRot * 180

        shapesStr += `<rect width="100" height="100" fill="${genColor()}" transform="translate(${tx} ${ty}) rotate(${rot.toFixed(1)} 50 50)"/>`
    }
    return `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${bgStr}${shapesStr}</svg>`
}
