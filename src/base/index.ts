const path = require('path')
const configs = {
  development: {
    dataPath: 'home',
    folder: 'org.vechain.ua'
  },
  production: {
    dataPath: 'appData',
    folder: 'org.vechain.ua'
  }
}

const app = getApp()
const config = configs[process.env.NODE_ENV as 'development' | 'production']

const suffix = process.platform === 'win32' ? '.exe' : ''
const folder = config.folder
const dataPath = app.getPath(config.dataPath)

function getApp() {
  if (process.type === 'renderer') {
    return require('electron').remote.app
  } else {
    return require('electron').app
  }
}

function getStaticPath(): string {
  if (process.env.NODE_ENV === 'development') {
    return 'static'
  } else {
    return path.join(__dirname, '/static').replace(/\\/g, '\\\\')
  }
}
const appBasePath = path.join(dataPath, folder)

export namespace BasePath {
  export const root: string = appBasePath
  export const keystores: string = path.join(appBasePath, 'keystore')
  export const db: string = path.join(appBasePath, 'db')
  export const log: string = path.join(appBasePath, 'log')
  export const __static: string = getStaticPath()
  export const execThorPath = path.join(BasePath.root, `/thor${suffix}`)
}

export namespace init {
  const fs = require('file-system')
  export const folder = function() {
    fs.mkdir(BasePath.root, function() {
      fs.mkdir(BasePath.keystores)
      fs.mkdir(BasePath.db)
      fs.mkdir(BasePath.log)
    })
  }

  export const copyThor = function() {
    const sourcePath = path.join(BasePath.__static, `/thor${suffix}`)
    let thorBuffer = fs.readFileSync(sourcePath)
    fs.writeFileSync(BasePath.execThorPath, thorBuffer, { mode: 0o700 })
  }
}
