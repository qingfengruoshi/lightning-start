import { Plugin, SearchResult } from '../../../shared/types/plugin';
import { ClipboardService } from '../../services/clipboard';

export class ClipboardPlugin implements Plugin {
    name = 'Clipboard History';
    description = 'Search and paste clipboard history';
    priority = 100;
    enabled = true;

    constructor(private clipboardService: ClipboardService) { }

    match(query: string): boolean {
        // Trigger with 'cb' or 'history' or always if enabled and fuzzy?
        // Let's stick to explicit keywords to avoid pollution?
        // Or if query is empty show nothing?
        // Let's try matching 'cb' prefix or if query matches content in history.
        return query.startsWith('cb') || query === 'history' || query === '剪贴板';
    }

    async search(query: string): Promise<SearchResult[]> {
        const history = this.clipboardService.getHistory();
        let keyword = '';

        if (query.startsWith('cb ')) {
            keyword = query.slice(3).toLowerCase();
        } else if (query.startsWith('cb')) {
            keyword = '';
        } else {
            // implicit match if we want global search? better explicit for now.
            return [];
        }

        const filtered = history.filter(item =>
            item.text.toLowerCase().includes(keyword)
        );

        return filtered.map(item => ({
            id: `clipboard:${item.id}`,
            title: item.text.replace(/\n/g, ' '),
            subtitle: new Date(item.timestamp).toLocaleString(),
            type: 'plugin',
            action: 'copy', // We'll handle this in action execution
            icon: '📋',
            data: item.text
        }));
    }
}
