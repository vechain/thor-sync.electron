import Vue from 'vue';
import HelloWorld from '../../../src/renderer/components/HelloWorld.vue';
import { expect } from 'chai';
import {} from 'mocha';

describe('HelloWorld.vue', () => {
  it('should render correct contents', () => {
    const Constructor = Vue.extend(HelloWorld);
    const vm = new Constructor().$mount();
    expect((vm as any).$el.querySelector('.hello h1').textContent).to.equal('Welcome to Your Vue.js App');
  });
});
