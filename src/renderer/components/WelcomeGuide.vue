<template>
  <div class="welcome-wrapper" v-if="visible">
      <div class="icon-section">
        <img :src="logoUrl" alt="Logo" class="app-logo" /> 
      </div>
      <h2>欢迎使用 Lightning Start</h2>
      <p class="subtitle">您的极速生产力工具</p>
      
      <div class="features-grid">
        <div class="feature-item">
          <span class="icon">🚀</span>
          <div class="text">
            <h4>快速启动</h4>
            <p>按下 <kbd>Alt</kbd> + <kbd>Space</kbd> 随时呼出</p>
          </div>
        </div>
        <div class="feature-item">
          <span class="icon">🧩</span>
          <div class="text">
            <h4>插件扩展</h4>
            <p>安装插件以解锁更多功能</p>
          </div>
        </div>
        <div class="feature-item">
          <span class="icon">🔍</span>
          <div class="text">
            <h4>智能搜索</h4>
            <p>搜索应用、文件或执行命令</p>
          </div>
        </div>
      </div>

      <button class="start-btn" @click="closeGuide">开始体验</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import logoUrl from '../assets/logo.png';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits(['close']);

function closeGuide() {
  emit('close');
}
</script>

<style scoped>
.welcome-wrapper {
  background: var(--bg-primary);
  width: 100%;
  height: 100%;
  padding: 32px;
  box-sizing: border-box;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  /* border: 1px solid var(--border-color); Removed border, let container handle it if needed */
  animation: fadeIn 0.3s ease;
  -webkit-app-region: no-drag; 
  /* Allow dragging globally but not on interactive elements? 
     Actually we usually want the whole window dragable if it's the main thing.
     But we have buttons. Let's make buttons no-drag.
  */
}
/* Re-enable drag for the background */
.welcome-wrapper {
   -webkit-app-region: drag;
}
button, .feature-item {
   -webkit-app-region: no-drag;
}
/* ... rest of styles ... */

.icon-section {
  margin-bottom: 20px;
}

.logo-text {
    font-size: 64px;
    margin-bottom: 16px;
}

.app-logo {
  width: 80px;
  height: 80px;
  object-fit: contain;
}

h2 {
  margin: 0 0 8px 0;
  color: var(--text-primary);
  font-size: 24px;
}

.subtitle {
  margin: 0 0 32px 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.features-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: left;
  margin-bottom: 32px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 12px;
}

.feature-item .icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  border-radius: 8px;
}

.feature-item h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: var(--text-primary);
}

.feature-item p {
  margin: 0;
  font-size: 12px;
  color: var(--text-muted);
}

kbd {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 2px 6px;
  font-family: inherit;
  font-size: 11px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.start-btn {
  width: 100%;
  padding: 12px;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.start-btn:hover {
  opacity: 0.9;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
