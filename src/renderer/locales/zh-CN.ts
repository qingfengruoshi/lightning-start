export default {
    settings: {
        title: '设置',
        save: '保存',
        saved: '已保存',
        nav: {
            basic: '基本设置',
            hotkey: '快捷键',
            search: '搜索与插件',
            advanced: '高级设置',
            about: '关于',
            plugin_manager: '插件管理'
        },
        basic: {
            title: '基本设置',
            autoStart: {
                label: '开机自启',
                desc: '系统启动时自动运行'
            },
            showTray: {
                label: '显示托盘图标',
                desc: '在系统托盘显示图标'
            },
            hideOnBlur: {
                label: '失去焦点时隐藏',
                desc: '当窗口失去焦点时自动隐藏'
            },
            language: {
                label: '语言'
            },
            theme: {
                label: '主题模式',
                options: {
                    dark: '深色',
                    light: '浅色',
                    auto: '跟随系统'
                }
            }
        },
        hotkey: {
            title: '快捷键',
            activation: {
                label: '激活快捷键',
                desc: '显示/隐藏窗口的全局快捷键',
                placeholder: '点击录制'
            },
            other: {
                label: '其他快捷键'
            }
        },
        search: {
            title: '搜索',
            placeholder: '搜索应用、文件或执行命令...',
            maxResults: {
                label: '最大结果数'
            },
            searchMode: {
                label: '搜索模式',
                options: {
                    fuzzy: '模糊匹配',
                    exact: '精确匹配'
                }
            },
            plugins: {
                title: '插件',
                manage: {
                    label: '管理插件',
                    btn: '打开插件中心'
                },
                names: {
                    appSearch: '应用搜索',
                    calculator: '计算器',
                    system: '系统命令',
                    clipboard: '剪贴板历史'
                }
            },
            localApp: {
                label: '本地应用索引',
                dropZone: '拖拽可执行文件或文件夹到此处建立索引',
                add: '添加文件/文件夹',
                empty: '暂无自定义路径，请拖拽文件或点击添加'
            },
            index: {
                label: '重建索引',
                desc: '手动重新扫描所有应用',
                btn: '开始重建'
            }
        },
        advanced: {
            title: '高级设置',
            opacity: {
                label: '窗口透明度'
            },
            superPanel: {
                label: '超级面板',
                comingSoon: '即将推出'
            },
            clipboard: {
                label: '剪贴板历史',
                desc: '记录并搜索剪贴板内容'
            }
        },
        about: {
            title: '关于',
            version: '版本',
            checkUpdate: '检查更新',
            author: '作者',
            license: '许可证',
            github: 'GitHub 仓库'
        }
    }
}
