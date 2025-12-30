<template>
  <div class="settings-panel">
    <div class="section-title">{{ t('settings.advanced.title') }}</div>
    
    <div class="settings-card">
        <!-- Opacity -->
        <div class="setting-group">
            <div class="setting-label-group">
                <label class="setting-label">{{ t('settings.advanced.opacity.label') }}</label>
            </div>
            <div class="control range-control">
                <input 
                    type="range" 
                    min="0.5" 
                    max="1" 
                    step="0.05" 
                    v-model.number="settings.window.opacity" 
                    @input="updateOpacity"
                    @change="endPreview"
                >
                <span class="value">{{ Math.round(settings.window.opacity * 100) }}%</span>
            </div>
        </div>

        <!-- Grid Gap -->
        <div class="setting-group">
            <div class="setting-label-group">
                <label class="setting-label">{{ t('settings.advanced.gridGap.label') }}</label>
            </div>
            <div class="control range-control">
                <input 
                    type="range" 
                    min="4" 
                    max="256" 
                    step="4" 
                    v-model.number="settings.window.gridGap" 
                    @input="updateGridGap"
                >
                <span class="value">{{ settings.window.gridGap }}px</span>
            </div>
        </div>

        <!-- Super Panel (Placeholder) -->
        <div class="setting-group">
            <div class="setting-label-group">
                <label class="setting-label">{{ t('settings.advanced.superPanel.label') }}</label>
            </div>
            <div class="control">
                <select disabled class="select-input disabled">
                    <option>{{ t('settings.advanced.superPanel.comingSoon') }}</option>
                </select>
            </div>
        </div>

        <!-- Clipboard -->

    </div>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import type { Settings } from '@shared/types/settings';
import { useI18n } from '../../composables/useI18n';
import { IPC_CHANNELS } from '@shared/constants';

const settings = inject<Settings>('settings')!;
const { t } = useI18n();

function updateOpacity() {
    window.electron.send('window:style-update', { opacity: settings.window.opacity });
}

function updateGridGap() {
    window.electron.send('window:style-update', { gridGap: settings.window.gridGap });
}

function endPreview() {
    window.electron.send(IPC_CHANNELS.WINDOW_HIDE);
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
}

.setting-label {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-secondary);
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
    background: var(--border-color); /* Was #e5e7eb */
    border-radius: 999px;
    appearance: none;
    cursor: pointer;
}

input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    background: #ffffff;
    border: 2px solid var(--accent-color);
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
    color: var(--text-muted);
}

.select-input {
    padding: 6px 12px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--bg-primary);
    font-size: 13px;
    color: var(--text-primary);
    min-width: 120px;
    outline: none;
}
.select-input.disabled {
    background: var(--bg-hover);
    color: var(--text-muted);
    cursor: not-allowed;
}

/* iOS Toggle Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}
.switch.disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
.switch input { opacity: 0; width: 0; height: 0; }
.slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: var(--border-color);
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
