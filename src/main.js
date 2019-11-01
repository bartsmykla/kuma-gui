import Vue from 'vue'
import App from '@/App.vue'
import router from '@/router'
import store from '@/store'
import VueMeta from 'vue-meta'
import '@/registerServiceWorker'

import Kuma from '@/services/kuma'

// Globally import all Kongponents
import '@/kongponents'

// Third party styles
import '@/assets/styles/third-party/tailwind.css'

// Kong Manager styles
import '@/assets/styles/kong-manager/inputs.css'

// Kuma styles
import '@/assets/styles/variables.css'
import '@/assets/styles/utilities.css'
import '@/assets/styles/fonts.css'
import '@/assets/styles/main.css'
import '@/assets/styles/typography.css'
import '@/assets/styles/inputs.css'

// Kong Design System styles
import '@kongponents/styles/styles.css'

const kuma = new Kuma({
  url: process.env.VUE_APP_KUMA_API || false
})

// Instance properties
// https://vuejs.org/v2/cookbook/adding-instance-properties.html
Vue.prototype.$api = kuma

Vue.use(VueMeta)

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
