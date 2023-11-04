import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
// import VueElectron from 'vue-electron';
import { ElInput, ElSelect, ElButton } from 'element-plus'
import 'element-plus/dist/index.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElInput)
  .use(ElSelect)
  .use(ElButton)
// app.use(VueElectron)

app.mount('#app')
