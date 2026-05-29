import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

// Electron API 주입
if (window.electronAPI) {
  app.config.globalProperties.$electron = window.electronAPI
} else {
  console.warn('Electron API not available (likely running in browser)')
}

app.mount('#app')

console.log('[NEXUS] Vue app mounted')

// "시각(時刻) 에 존재하고, 시간(時間) 에 소멸한다."
// "시각(時刻)에 존재하고, 시간(時間) 에 소멸한다." 🫡