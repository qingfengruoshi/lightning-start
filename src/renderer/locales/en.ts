export default {
    settings: {
        title: 'Settings',
        save: 'Save',
        saved: 'Saved',
        nav: {
            basic: 'General',
            hotkey: 'Hotkeys',
            search: 'Search & Plugins',
            advanced: 'Advanced',
            about: 'About',
            plugin_manager: 'Plugins'
        },
        basic: {
            title: 'General',
            autoStart: {
                label: 'Auto Start',
                desc: 'Launch automatically on system startup'
            },
            showTray: {
                label: 'Show Tray Icon',
                desc: 'Show icon in system tray'
            },
            hideOnBlur: {
                label: 'Hide on Blur',
                desc: 'Hide window when focus is lost'
            },
            language: {
                label: 'Language'
            },
            theme: {
                label: 'Theme',
                options: {
                    dark: 'Dark',
                    light: 'Light',
                    auto: 'System'
                }
            },
            pluginPath: {
                label: 'Plugin Directory',
                desc: 'Change plugin location (Restart required)',
                btn: 'Browse...',
                default: 'Default Location'
            }
        },
        hotkey: {
            title: 'Hotkeys',
            activation: {
                label: 'Activation Hotkey',
                desc: 'Global hotkey to show/hide window',
                placeholder: 'Click to Record'
            },
            other: {
                label: 'Other Hotkeys'
            }
        },
        search: {
            title: 'Search',
            placeholder: 'Search apps, files or commands...',
            maxResults: {
                label: 'Max Results'
            },
            searchMode: {
                label: 'Search Mode',
                options: {
                    fuzzy: 'Fuzzy',
                    exact: 'Exact'
                }
            },
            plugins: {
                title: 'Plugins',
                manage: {
                    label: 'Manage Plugins',
                    btn: 'Open Plugin Center'
                },
                names: {
                    appSearch: 'App Search',
                    calculator: 'Calculator',
                    system: 'System Commands',
                    clipboard: 'Clipboard History'
                },
                descriptions: {
                    appSearch: 'Search installed applications',
                    calculator: 'Built-in basic calculator',
                    system: 'System level commands',
                    clipboard: 'Record and search clipboard history'
                }
            },
            localApp: {
                label: 'Local App Index',
                dropZone: 'Drag executables here to index'
            }
        },
        advanced: {
            title: 'Advanced',
            opacity: {
                label: 'Window Opacity'
            },
            gridGap: {
                label: 'History Grid Spacing'
            },
            superPanel: {
                label: 'Super Panel',
                comingSoon: 'Coming Soon'
            },
            clipboard: {
                label: 'Clipboard History',
                desc: 'Record and search clipboard content'
            }
        },
        about: {
            title: 'About',
            version: 'Version',
            checkUpdate: 'Check Update',
            author: 'Author',
            license: 'License',
            github: 'GitHub Repository',
            visit: 'Click to Visit'
        }
    }
}
