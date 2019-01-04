const key = 'first-time-run'

export const isFirstTimeRun = (() => {
    if (!localStorage.getItem(key)) {
        localStorage.setItem(key, 't')
        return true
    }
    return false
})()
