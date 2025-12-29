import { Plugin, SearchResult } from '@shared/types/plugin';

export class CalculatorPlugin implements Plugin {
    name = 'calculator';
    description = '简单的计算器插件';
    priority = 90;
    enabled = true;

    match(query: string): boolean {
        // 匹配数学表达式
        return /^[\d+\-*/().^√\s]+$/.test(query) && query.length > 0;
    }

    async search(query: string): Promise<SearchResult[]> {
        try {
            const result = this.evaluate(query);

            if (result === null || isNaN(result)) {
                return [];
            }

            return [
                {
                    id: 'calc:result',
                    title: result.toString(),
                    subtitle: `= ${query}`,
                    type: 'calculator',
                    action: 'copy-to-clipboard',
                    data: { text: result.toString() },
                    icon: '🔢',
                },
            ];
        } catch {
            return [];
        }
    }

    private evaluate(expression: string): number | null {
        try {
            // 清理表达式
            let cleaned = expression.replace(/\s/g, '');

            // 处理开方
            cleaned = cleaned.replace(/√(\d+)/g, 'Math.sqrt($1)');

            // 处理幂运算
            cleaned = cleaned.replace(/(\d+)\^(\d+)/g, 'Math.pow($1,$2)');

            // 使用 Function 而非 eval（相对更安全）
            const func = new Function('Math', `return ${cleaned}`);
            const result = func(Math);

            return typeof result === 'number' ? result : null;
        } catch {
            return null;
        }
    }
}
