import { Vue } from 'vue-property-decorator'
import { clipboard } from 'electron'

function write(str: string) {
    clipboard.writeText(str)
}
Vue.directive('clipboard', {
    bind(el: HTMLElement, binding: any) {
        el.addEventListener('click', () => {
            write(binding.value)
        })
    }
})

Vue.directive('nofocusout', {
    bind(el: HTMLElement, binding: any) {
        el.tabIndex = -1
        el.addEventListener('focusout', (event: any) => {
            if (!el.contains(event.relatedTarget)) {
                el.focus()
            }
        })
    }
})
