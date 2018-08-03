// import Vue from 'vue';
// Vue.config.devtools = false;
// Vue.config.productionTip = false;

// require all test files (files that ends with .spec.js)
const testsContext = (require as any).context('./specs', true, /\.spec.ts$/);
testsContext.keys().forEach(testsContext);

// require all src files except main.js for coverage.
// you can also change this to match only the subset of files that
// you want coverage for.
const srcTSContext = (require as any).context('../../src/renderer', true, /^\.\/(?!main(\.ts)?$)/);
srcTSContext.keys().forEach(srcTSContext);

const srcVueContext = (require as any).context('../../src/renderer', true, /\.vue$/);
srcVueContext.keys().forEach(srcVueContext);
