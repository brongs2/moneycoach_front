import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 로컬 네트워크에서 접근 가능하도록 설정
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://192.168.0.20:8000',  // 백엔드 컴퓨터 IP
        changeOrigin: true,
      },
    },
  },
})



