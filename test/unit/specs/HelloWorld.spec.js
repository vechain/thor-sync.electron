import Vue from 'vue'
import HelloWorld from '@/components/HelloWorld.vue'

describe('HelloWorld.vue', () => {
  it('should render correct contents', () => {
    const vm = new Vue({
      el: document.createElement('div'),
      render: h => h(HelloWorld)
    }).$mount()

    expect(vm.$el.querySelector('h1').textContent).to.contain('Welcome to Your Vue.js + TypeScript App')
  })
})
