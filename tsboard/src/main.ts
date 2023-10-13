import { createApp } from 'vue'
import './style.css'
import App from './Editor.vue'

const app = createApp(App)

// expose window to vue template
app.config.globalProperties.window = window
app.mount('#app')
