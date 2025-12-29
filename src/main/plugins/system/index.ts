import { Plugin, SearchResult } from '@shared/types/plugin';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class SystemPlugin implements Plugin {
    name = 'system';
    description = '系统命令插件';
    priority = 80;
    enabled = true;

    private commands = [
        { keyword: 'shutdown', title: '关机', command: 'shutdown /s /t 0', icon: '⚡' },
        { keyword: 'restart', title: '重启', command: 'shutdown /r /t 0', icon: '🔄' },
        { keyword: 'sleep', title: '睡眠', command: 'rundll32.exe powrprof.dll,SetSuspendState 0,1,0', icon: '💤' },
        { keyword: 'lock', title: '锁屏', command: 'rundll32.exe user32.dll,LockWorkStation', icon: '🔒' },
        { keyword: 'logout', title: '注销', command: 'shutdown /l', icon: '👋' },
    ];

    match(query: string): boolean {
        const lowerQuery = query.toLowerCase();
        return this.commands.some((cmd) => cmd.keyword.startsWith(lowerQuery));
    }

    async search(query: string): Promise<SearchResult[]> {
        const lowerQuery = query.toLowerCase();

        return this.commands
            .filter((cmd) => cmd.keyword.startsWith(lowerQuery))
            .map((cmd) => ({
                id: `system:${cmd.keyword}`,
                title: cmd.title,
                subtitle: cmd.keyword,
                icon: cmd.icon,
                type: 'system',
                action: 'execute-system-command',
                data: { command: cmd.command },
            }));
    }

    static async executeCommand(command: string): Promise<void> {
        await execAsync(command);
    }
}
