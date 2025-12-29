<template>
  <div class="settings-panel">
    <div class="section-title">{{ t('settings.basic.title') }}</div>
    
    <div class="settings-card">
        <!-- Auto Start -->
        <div class="setting-group">
            <div class="setting-label-group">
                <label class="setting-label">{{ t('settings.basic.autoStart.label') }}</label>
                <div class="setting-desc">{{ t('settings.basic.autoStart.desc') }}</div>
            </div>
            <div class="control">
                <label class="switch">
                    <input type="checkbox" v-model="settings.autoStart">
                    <span class="slider round"></span>
                </label>
            </div>
        </div>

        <!-- Show Tray -->
        <div class="setting-group">
            <div class="setting-label-group">
                <label class="setting-label">{{ t('settings.basic.showTray.label') }}</label>
                <div class="setting-desc">{{ t('settings.basic.showTray.desc') }}</div>
            </div>
            <div class="control">
                <label class="switch">
                    <input type="checkbox" v-model="settings.showTray">
                    <span class="slider round"></span>
                </label>
            </div>
        </div>

        <!-- Hide on Blur -->
        <div class="setting-group">
            <div class="setting-label-group">
                <label class="setting-label">{{ t('settings.basic.hideOnBlur.label') }}</label>
                <div class="setting-desc">{{ t('settings.basic.hideOnBlur.desc') }}</div>
            </div>
            <div class="control">
                <label class="switch">
                    <input type="checkbox" v-model="settings.hideOnBlur">
                    <span class="slider round"></span>
                </label>
            </div>
        </div>

        <!-- Language -->
        <div class="setting-group">
             <div class="setting-label-group">
                <label class="setting-label">{{ t('settings.basic.language.label') }}</label>
            </div>
            <div class="control">
                <select v-model="settings.language" class="select-input">
                    <option value="en">English</option>
                    <option value="zh-CN">中文</option>
                </select>
            </div>
        </div>

        <!-- Theme -->
        <div class="setting-group">
             <div class="setting-label-group">
                <label class="setting-label">{{ t('settings.basic.theme.label') }}</label>
            </div>
            <div class="control">
                 <select v-model="settings.theme" class="select-input">
                    <option value="dark">{{ t('settings.basic.theme.options.dark') }}</option>
                    <option value="light">{{ t('settings.basic.theme.options.light') }}</option>
                    <option value="auto">{{ t('settings.basic.theme.options.auto') }}</option>
                </select>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import type { Settings } from '@shared/types/settings';
import { useI18n } from '../../composables/useI18n';

const settings = inject<Settings>('settings')!;
const { t } = useI18n();
</script>

<style scoped>
/* Reuse existing styles + new desc style */
.settings-panel {
    max-width: 100%;
    margin: 0;
    font-family: inherit;
}

.section-title {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 24px;
    color: var(--text-primary);
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
    border-bottom: 1px solid var(--border-color);
}

.setting-group:first-child {
    padding-top: 0;
}

.setting-label-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.setting-label {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-secondary);
    letter-spacing: 0.2px;
}

.setting-desc {
    font-size: 12px;
    color: var(--text-muted);
}

.control {
    display: flex;
    align-items: center;
    gap: 16px;
    min-width: 200px;
    justify-content: flex-end;
}

/* Select Input */
.select-input {
    padding: 6px 12px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--bg-primary);
    font-size: 13px;
    color: var(--text-primary);
    min-width: 120px;
    outline: none;
    cursor: pointer;
}
.select-input:focus {
    border-color: var(--accent-color);
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
  background-color: var(--border-color); /* Was #e5e7eb */
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
input:checked + .slider { background-color: var(--accent-color); }
input:checked + .slider:before { transform: translateX(20px); }
</style>
