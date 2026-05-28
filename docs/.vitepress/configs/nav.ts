import type { DefaultTheme } from 'vitepress';

export const nav: DefaultTheme.Config['nav'] = [
    { text: 'Home', link: '/' },
    { text: '导航', link: '/nav/' },
    {
        text: '专题',
        activeMatch: '^/special',
        items: [
            {
                text: '中后台最佳实践',
                link: '/special/mid-end/',
            },
            {
                text: 'Blog',
                link: 'https://www.yuque.com/hlwzn/hi5s1y/cgz8tiboucrausuy',
            },
            {
                text: 'VsCode 插件开发',
                link: '/special/vscode-ext/hello-world/',
            },
            {
                text: 'Rust',
                link: 'https://www.yuque.com/hlwzn/hi5s1y/rmag3ifg4bxtlnaa',
            },
            {
                text: '培训',
                link: 'https://www.yuque.com/hlwzn/hi5s1y/hn2vybe0sauos7qn',
            },
            {
                text: 'AI',
                link: '/special/ai/process/',
            },
            {
                text: '管理',
                link: 'https://www.yuque.com/hlwzn/hi5s1y/hx8f72t16g8al1a9',
            },
        ],
    },
    {
        text: 'Workflow',
        activeMatch: '^/workflow',
        items: [
            {
                text: 'JavaScript',
                link: '/workflow/javascript/',
            },
            {
                items: [{ text: 'HTML 技巧', link: '/workflow/html/tricks' }],
            },
            {
                items: [{ text: '工具链', link: '/workflow/toolchain/git' }],
            },
        ],
    },
    {
        text: '工具与配置',
        activeMatch: '^/powerfully',
        items: [
            {
                text: '开发',
                items: [
                    {
                        text: 'VsCode',
                        link: '/powerfully/vscode/',
                    },
                    {
                        text: 'ClaudeCode',
                        link: '/powerfully/ClaudeCode/',
                    },
                ],
            },
            {
                text: '服务器',
                items: [
                    {
                        text: 'Vps',
                        link: '/powerfully/vps/',
                    },
                    {
                        text: 'Nas',
                        link: '/powerfully/nas/OpenList/',
                    },
                    {
                        text: 'Openwrt',
                        link: '/powerfully/openwrt/init.md',
                    },
                ],
            },
        ],
    },
    // {
    //     text: 'Demo',
    //     activeMatch: '^/demo',
    //     link: '/demo/api-examples',
    // },
    {
        text: '✍️Blog',
        link: 'https://lqzh.me/',
    },
    {
        text: '💡idea',
        link: 'https://idea.lqzh.me/share',
    },
];
