// import { ActionTree } from 'vuex'
import { getDApps } from '@/renderer/../base/'
const win = window as any
const appPath = win.__dappsHost

export const getBuildInDapps = () => {
  const result: object[] = []
  const names = getDApps()
  names.forEach(name => {
    result.push({
      name: name,
      url: `${appPath}${name}.html`
    })
  })

  return result
}

// export const actions: ActionTree<> = {

// }
