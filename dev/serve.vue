<script lang="ts">
import Vue from 'vue';
// Uncomment import and local "components" registration if library is not registered globally.
// import { CmoisslVueComponentsSample } from '@/entry.esm';

export default Vue.extend({
  name: 'ServeDev',
  // components: {
  //  CmoisslVueComponentsSample,
  // }
});
</script>

<template>
  <div id="app">
    <cmoissl-vue-components-sample />
  </div>
</template>
