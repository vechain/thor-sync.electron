import { Vue } from 'vue-property-decorator'
import { clipboard } from 'electron'
import { VNode } from '../../node_modules/vue'

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
    _needFocusout?: boolean
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
      if (!el._needFocusout) {
        return
      }
      if (!el.contains(event.relatedTarget)) {
        el.focus()
      }
    }
    el.addEventListener('focusout', callback)
    el._needFocusout = true
    el._focusout = {
      callback
    }
  },
  update(el: HTMLElement, binding: any) {
    el._needFocusout = binding.value
  },
  unbind(el: HTMLElement) {
    if (el._focusout) {
      el.removeEventListener('focusout', el._focusout!.callback)
      delete el._focusout
      delete el._needFocusout
    }
  }
})

Vue.directive('focus', {
  inserted(el: HTMLElement, binding: any) {
    const tags: string[] = ['input', 'textarea', 'select']
    const tempEl =
      tags.indexOf(el.tagName.toLocaleLowerCase()) >= 0
        ? (el as any)
        : el.getElementsByTagName('input')[0] ||
          el.getElementsByTagName('textarea')[0] ||
          el.getElementsByTagName('select')[0]
    setTimeout(() => {
      // tslint:disable-next-line:no-unused-expression
      tempEl.focus && tempEl.focus()

      if (el.tagName.toLocaleUpperCase() === 'input') {
        // tslint:disable-next-line:no-unused-expression
        tempEl.select && tempEl.select()
      }
    }, 0)
  }
})
