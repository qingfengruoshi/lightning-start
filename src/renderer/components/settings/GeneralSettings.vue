<template>
  <div class="settings-panel">
    <div class="section-title">基本设置</div>
    
    <div class="settings-card">
        <div class="setting-group">
            <label class="setting-label">开机自启</label>
            <div class="control">
                <label class="switch">
                    <input type="checkbox" v-model="settings.autoStart" @change="updateSetting('autoStart', settings.autoStart)">
                    <span class="slider round"></span>
                </label>
            </div>
        </div>

        <div class="setting-group">
        <label class="setting-label">快捷键</label>
        <div class="control">
            <input 
                type="text" 
                v-model="hotkeyDisplay" 
                @click="changeHotkey"
                placeholder="点击切换"
                class="hotkey-input"
                readonly
            >
        </div>
        </div>

        <div class="setting-group">
            <label class="setting-label">窗口透明度</label>
            <div class="control range-control">
                <input 
                    type="range" 
                    min="0.1" 
                    max="1" 
                    step="0.05" 
                    v-model.number="settings.window.opacity" 
                    @input="updateWindowSetting('opacity', settings.window.opacity)"
                >
                <span class="value">{{ Math.round(settings.window.opacity * 100) }}%</span>
            </div>
        </div>

        <div class="setting-group">
            <label class="setting-label">字体大小</label>
            <div class="control range-control">
                <input 
                    type="range" 
                    min="12" 
                    max="24" 
                    step="1" 
                    v-model.number="settings.window.fontSize" 
                    @input="updateWindowSetting('fontSize', settings.window.fontSize)"
                >
                <span class="value">{{ settings.window.fontSize }}px</span>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { IPC_CHANNELS } from '@shared/constants';
import type { Settings } from '@shared/types/settings';

const settings = reactive<Settings>({
    hotkey: '',
    theme: 'auto',
    language: 'zh-CN',
    autoStart: false,
    hideOnBlur: true,
    showTray: true,
    maxResults: 10,
    searchMode: 'fuzzy',
    customPaths: [],
    window: { width: 800, height: 600, opacity: 1, fontSize: 14 },
    plugins: {}
});

const hotkeyDisplay = ref('');

onMounted(async () => {
    const saved = await window.electron.invoke(IPC_CHANNELS.SETTINGS_GET);
    Object.assign(settings, saved);
    hotkeyDisplay.value = settings.hotkey;
});

async function updateSetting(key: keyof Settings, value: any) {
    await window.electron.invoke(IPC_CHANNELS.SETTINGS_SET, key, value);
}

async function updateWindowSetting(key: string, value: any) {
    const newWindowSettings = { ...settings.window, [key]: value };
    settings.window = newWindowSettings;
    await window.electron.invoke(IPC_CHANNELS.SETTINGS_SET, 'window', newWindowSettings);
}

function changeHotkey() {
    const options = ['Alt+Space', 'Alt+R'];
    const currentIndex = options.indexOf(settings.hotkey);
    // Cycle to next, or default to first if not found
    const nextIndex = (currentIndex + 1) % options.length;
    const nextHotkey = options[nextIndex];

    hotkeyDisplay.value = nextHotkey;
    settings.hotkey = nextHotkey;
    updateSetting('hotkey', nextHotkey);
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
    padding: 20px 0; /* Compact spacing */
    border-bottom: 1px solid #f3f4f6;
}

.setting-group:first-child {
    padding-top: 0;
}

.setting-label {
    font-size: 14px; /* Slightly smaller for compact feel */
    font-weight: 500;
    color: #374151;
    letter-spacing: 0.2px;
}

.control {
    display: flex;
    align-items: center;
    gap: 16px;
    min-width: 200px; /* Reduced width */
    justify-content: flex-end;
}

/* Hotkey Button Style */
.hotkey-input {
    padding: 8px 16px; /* More compact */
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    background: #ffffff;
    color: #111827;
    font-family: inherit;
    font-weight: 600;
    font-size: 13px;
    min-width: 100px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.hotkey-input:hover {
    border-color: #d1d5db;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    transform: translateY(-1px);
}

.hotkey-input:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 4px rgba(37,99,235,0.1);
    outline: none;
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
    height: 4px; /* Thinner track */
    background: #e5e7eb;
    border-radius: 999px;
    appearance: none;
    cursor: pointer;
}

input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    width: 16px; /* Smaller thumb */
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

/* iOS Toggle Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.switch input { opacity: 0; width: 0; height: 0; }

.slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: #e5e7eb;
  transition: .3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
}

input:checked + .slider {
  background-color: #3b82f6;
}

input:checked + .slider:before {
  transform: translateX(20px);
}
</style>
