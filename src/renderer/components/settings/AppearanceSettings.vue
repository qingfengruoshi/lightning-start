<template>
  <div class="settings-panel">
    <div class="section-title">外观与交互</div>
    
    <div class="settings-card">
        <div class="setting-group">
            <label class="setting-label">搜索框宽度</label>
            <div class="control range-control">
                <input 
                    type="range" 
                    min="600" 
                    max="1200" 
                    step="50" 
                    v-model.number="settings.window.width" 
                    @input="updateWindowSetting('width', settings.window.width)"
                >
                <span class="value">{{ settings.window.width }}px</span>
            </div>
        </div>

        <div class="setting-group">
            <label class="setting-label">最大高度限制</label>
            <div class="control range-control">
                <input 
                    type="range" 
                    min="400" 
                    max="1000" 
                    step="50" 
                    v-model.number="settings.window.height" 
                    @input="updateWindowSetting('height', settings.window.height)"
                >
                <span class="value">{{ settings.window.height }}px</span>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import { IPC_CHANNELS } from '@shared/constants';
import type { Settings } from '@shared/types/settings';

const settings = reactive<Settings>({
    hotkey: '',
    theme: 'auto',
    language: 'zh-CN',
    autoStart: false,
    hideOnBlur: true,
    maxResults: 10,
    customPaths: [],
    window: { width: 800, height: 600, opacity: 1, fontSize: 14 },
    plugins: {}
});

onMounted(async () => {
    const saved = await window.electron.invoke(IPC_CHANNELS.SETTINGS_GET);
    Object.assign(settings, saved);
});

async function updateWindowSetting(key: string, value: any) {
    const newWindowSettings = { ...settings.window, [key]: value };
    settings.window = newWindowSettings;
    await window.electron.invoke(IPC_CHANNELS.SETTINGS_SET, 'window', newWindowSettings);
}
</script>

<style scoped>
.settings-panel {
    max-width: 100%;
    margin: 0;
    font-family: inherit;
}

.section-title {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 24px;
    color: #111827;
}

.settings-card {
    background: transparent;
    border: none;
    padding: 0;
}

.setting-group {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 0;
    border-bottom: 1px solid #f3f4f6;
}

.setting-group:first-child {
    padding-top: 0;
}

.setting-label {
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    letter-spacing: 0.2px;
}

.control {
    display: flex;
    align-items: center;
    gap: 16px;
    min-width: 200px;
    justify-content: flex-end;
}

/* Range Slider */
.range-control {
    width: 200px;
    display: flex;
    align-items: center;
    gap: 12px;
}

input[type="range"] {
    flex: 1;
    height: 4px;
    background: #e5e7eb;
    border-radius: 999px;
    appearance: none;
    cursor: pointer;
}

input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    background: #ffffff;
    border: 2px solid #3b82f6;
    border-radius: 50%;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    margin-top: -6px;
}

input[type="range"]::-webkit-slider-runnable-track {
    height: 4px;
    border-radius: 999px;
}

input[type="range"]::-webkit-slider-thumb:hover {
    transform: scale(1.1);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.value {
    min-width: 40px;
    text-align: right;
    font-variant-numeric: tabular-nums;
    font-size: 14px;
    font-weight: 500;
    color: #6b7280;
}
</style>
