import { onMounted, onUnmounted } from 'vue';

interface KeyboardOptions {
    onArrowDown?: () => void;
    onArrowUp?: () => void;
    onEnter?: () => void;
    onEscape?: () => void;
}

export function useKeyboard(options: KeyboardOptions) {
    function handleKeydown(e: KeyboardEvent) {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                options.onArrowDown?.();
                break;
            case 'ArrowUp':
                e.preventDefault();
                options.onArrowUp?.();
                break;
            case 'Enter':
                e.preventDefault();
                options.onEnter?.();
                break;
            case 'Escape':
                e.preventDefault();
                options.onEscape?.();
                break;
        }
    }

    onMounted(() => {
        document.addEventListener('keydown', handleKeydown);
    });

    onUnmounted(() => {
        document.removeEventListener('keydown', handleKeydown);
    });
}
