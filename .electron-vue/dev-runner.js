'use strict'

const chalk = require('chalk')
const electron = require('electron')
const path = require('path')
const { say } = require('cfonts')
const { spawn } = require('child_process')
const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const webpackHotMiddleware = require('webpack-hot-middleware')

const mainConfig = require('./webpack.main.config')
const rendererConfig = require('./webpack.renderer.config')
const dappsConfig = require('./webpack.dapps.config')
const preloadConfig = require('./webpack.preload.config')

let electronProcess = null
let manualRestart = false
let hotMiddleware
let subHotMiddleware

function logStats(proc, data) {
    let log = ''

    log += chalk.yellow.bold(`┏ ${proc} Process ${new Array((19 - proc.length) + 1).join('-')}`)
    log += '\n\n'

    if (typeof data === 'object') {
        data.toString({
            colors: true,
            chunks: false
        }).split(/\r?\n/).forEach(line => {
            log += '  ' + line + '\n'
        })
    } else {
        log += `  ${data}\n`
    }

    log += '\n' + chalk.yellow.bold(`┗ ${new Array(28 + 1).join('-')}`) + '\n'

    console.log(log)
}

function startDapps() {
    return new Promise(resolve => {
        Object.keys(dappsConfig.entry).forEach(item => {
            dappsConfig.entry[item] = [path.join(__dirname, 'dev-client')].concat(dappsConfig.entry[item])
        })

        const compiler = webpack(dappsConfig)

        subHotMiddleware = webpackHotMiddleware(compiler, {
            log: false,
            heartbeat: 2500
        })

        compiler.plugin('compilation', compilation => {
            compilation.plugin('html-webpack-plugin-after-emit', (data, cb) => {
                subHotMiddleware.publish({ action: 'reload' })
                cb()
            })
        })

        compiler.plugin('done', stats => {
            logStats('Dapps', stats)
        })

        const server = new WebpackDevServer(
            compiler,
            {
                contentBase: path.join(__dirname, '../'),
                quiet: true,
                before(app, ctx) {
                    app.use(subHotMiddleware)
                    ctx.middleware.waitUntilValid(() => {
                        resolve()
                    })
                }
            }
        )

        server.listen(9090)
    })
}

function startRenderer() {
    return new Promise(resolve => {
        rendererConfig.entry.renderer = [path.join(__dirname, 'dev-client')].concat(rendererConfig.entry.renderer)

        const compiler = webpack(rendererConfig)
        hotMiddleware = webpackHotMiddleware(compiler, {
            log: false,
            heartbeat: 2500
        })

        compiler.plugin('compilation', compilation => {
            compilation.plugin('html-webpack-plugin-after-emit', (data, cb) => {
                hotMiddleware.publish({ action: 'reload' })
                cb()
            })
        })

        compiler.plugin('done', stats => {
            logStats('Renderer', stats)
        })

        const server = new WebpackDevServer(
            compiler,
            {
                contentBase: path.join(__dirname, '../'),
                quiet: true,
                before(app, ctx) {
                    app.use(hotMiddleware)
                    ctx.middleware.waitUntilValid(() => {
                        resolve()
                    })
                }
            }
        )

        server.listen(9080)
    })
}

function startPreload() {
    return new Promise((resolve, reject) => {
        webpack(preloadConfig).run((err, stats) => {
            if (err) {
                return reject(err)
            }
            logStats('Preload', stats)
            resolve()
        })
    })
}

function startMain() {
    return new Promise(resolve => {
        mainConfig.entry.main = path.join(__dirname, '../src/main/index.dev.ts')
        webpack(mainConfig).run((err, stats) => {
            if (err) {
                return reject(err)
            }
            logStats('Main', stats)
            resolve()
        })
    })
}

function startElectron() {
    electronProcess = spawn(electron, ['--inspect=5858', '.'])

    electronProcess.stdout.on('data', data => {
        electronLog(data, 'blue')
    })
    electronProcess.stderr.on('data', data => {
        electronLog(data, 'red')
    })

    electronProcess.on('close', () => {
        if (!manualRestart) process.exit()
    })
}

function electronLog(data, color) {
    let log = ''
    data = data.toString().split(/\r?\n/)
    data.forEach(line => {
        log += `  ${line}\n`
    })
    if (/[0-9A-z]+/.test(log)) {
        console.log(
            chalk[color].bold('┏ Electron -------------------') +
            '\n\n' +
            log +
            chalk[color].bold('┗ ----------------------------') +
            '\n'
        )
    }
}

function greeting() {
    const cols = process.stdout.columns
    let text = ''

    if (cols > 104) text = 'electron-vue'
    else if (cols > 76) text = 'electron-|vue'
    else text = false

    if (text) {
        say(text, {
            colors: ['yellow'],
            font: 'simple3d',
            space: false
        })
    } else console.log(chalk.yellow.bold('\n  electron-vue'))
    console.log(chalk.blue('  getting ready...') + '\n')
}

async function init() {
    greeting()
    try {
        await Promise.all([startRenderer(), startDapps(), startMain(), startPreload()])
        startElectron()
    } catch (err) {
        console.log(err)
        process.exit()
    }
}

init()
