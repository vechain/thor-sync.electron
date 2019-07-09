const abiList: Map<string, string> = new Map()
async function queryABI(sig: string) {
  const url = `https://b32.vecha.in/q/${sig}.json`

  const resp = await fetch(url)
  if (resp.status === 404) {
    return null
  }

  if (resp.status !== 200) {
    throw new Error(`Failed to query ABI (status: ${resp.status})`)
  }

  const json = await resp.json()
  if (!Array.isArray(json) || !json[0]) {
    throw new Error('Failed to query ABI (bad response)')
  }

  return json[0]
}

function hasAbi(k: string): boolean {
  return abiList.has(k)
}

function setAbi(k: string, abi: any) {
  abiList.set(k, JSON.stringify(abi))
}

async function getAbi(k: string) {
  if (hasAbi(k)) {
    return JSON.parse(abiList.get(k) || 'null')
  } else {
    const abi = await queryABI(k)
    setAbi(k, abi)
    return abi
  }
}

export default getAbi
