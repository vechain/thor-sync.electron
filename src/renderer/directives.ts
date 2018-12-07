import { Vue } from 'vue-property-decorator'
import { clipboard } from 'electron'

function write(str: string) {
  clipboard.writeText(str)
}

declare global {
  interface HTMLElement {
    _onclick?: {
      callback: () => void;
    }
    _focusout?: {
      callback: (event: any) => void;
    }
  }
}

Vue.directive('clipboard', {
  bind(el: HTMLElement, binding: any) {
    const callback = () => {
      write(binding.value)
    }

    el.addEventListener('click', callback)
    el._onclick = {
      callback
    }
  },
  unbind(el: HTMLElement) {
    if (el._onclick) {
      el.removeEventListener('click', el._onclick!.callback)
      delete el._onclick
    }
  }
})

Vue.directive('nofocusout', {
  bind(el: HTMLElement, binding: any) {
    el.tabIndex = -1
    const callback = (event: any) => {
      if (!el.contains(event.relatedTarget)) {
        el.focus()
      }
    }
    el.addEventListener('focusout', callback)
    el._focusout = {
      callback
    }
  },
  unbind(el: HTMLElement) {
    if (el._focusout) {
      el.removeEventListener('focusout', el._focusout!.callback)
      delete el._focusout
    }
  }
})
