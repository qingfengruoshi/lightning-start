import { ref, computed } from 'vue';
import zhCN from '../locales/zh-CN';
import en from '../locales/en';

const messages = {
    'zh-CN': zhCN,
    'en': en
};

const currentLocale = ref('zh-CN');

export function useI18n() {
    function t(path: string): string {
        const keys = path.split('.');
        let value: any = messages[currentLocale.value as keyof typeof messages];

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return path; // Fallback to key
            }
        }

        return value as string;
    }

    function setLocale(locale: string) {
        if (locale in messages) {
            currentLocale.value = locale;
        }
    }

    return {
        t,
        setLocale,
        currentLocale
    };
}
