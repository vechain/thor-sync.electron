import { Vue } from 'vue-property-decorator'
import { clipboard } from 'electron'

function write(str: string) {
    clipboard.writeText(str)
}
Vue.directive('clipboard', {
    bind(el: Element, binding: any) {
        el.addEventListener('click', () => {
            write(binding.value)
        })
    }
})
