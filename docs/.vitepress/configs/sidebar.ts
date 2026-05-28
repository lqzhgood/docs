import type { DefaultTheme } from 'vitepress';

export const sidebar: DefaultTheme.Config['sidebar'] = {
    // '/fe/': [
    //
    //
    //
    //
    //     {
    //         text: 'HTML ',
    //         items: [{ text: '元素相关', link: '/fe/html/elm' }],
    //     },
    // ],
    '/special/': [
        {
            text: '中后台最佳实践',
            items: [
                {
                    text: '合集',
                    link: '/special/mid-end/',
                },
                {
                    text: 'B端性能优化',
                    link: '/special/mid-end/optimized/',
                },
            ],
        },
        {
            text: 'Blog',
            items: [
                {
                    text: '📽️ 看个电影怎么这么折腾',
                    link: 'https://www.yuque.com/hlwzn/hi5s1y/cgz8tiboucrausuy',
                },
                {
                    text: '💄 口红',
                    link: 'https://www.yuque.com/hlwzn/hi5s1y/rh8vl83uu0u2ixl2',
                },
                {
                    text: '☀️ HDR与前端应用',
                    link: 'https://www.yuque.com/hlwzn/hi5s1y/yqsig3g4wdxz4t0c',
                },
                {
                    text: '🎯 黑客松',
                    link: '/special/blog/hackathon/',
                },
            ],
        },
        {
            text: 'Vscode 插件开发',
            items: [
                {
                    text: 'HelloWorld',
                    link: '/special/vscode-ext/hello-world/',
                },
                {
                    text: '初步认识',
                    link: '/special/vscode-ext/begin/',
                },
                {
                    text: '实战-dotAnything',
                    link: '/special/vscode-ext/make/dotAnything',
                },
            ],
        },
        {
            text: 'Rust',
            items: [
                {
                    text: '从解释器到编译器',
                    link: 'https://www.yuque.com/hlwzn/hi5s1y/rmag3ifg4bxtlnaa',
                },
            ],
        },
        {
            text: 'Hello Real World 培训',
            items: [
                {
                    text: 'noGit',
                    link: 'https://www.yuque.com/hlwzn/hi5s1y/hn2vybe0sauos7qn',
                },
                {
                    text: '浏览器插件-如何修改页面',
                    link: 'https://www.yuque.com/hlwzn/hi5s1y/lq9e1qtatksd6lhv',
                },
            ],
        },
        {
            text: 'AI',
            items: [
                {
                    text: 'AI发展',
                    link: '/special/ai/process/',
                },
            ],
        },
        {
            text: '管理',
            items: [
                {
                    text: '目标与考核',
                    link: 'https://www.yuque.com/hlwzn/hi5s1y/hx8f72t16g8al1a9',
                },
                {
                    text: '把话讲清楚',
                    link: 'https://www.yuque.com/hlwzn/hi5s1y/sz2umztr53hr4bsi',
                },
            ],
        },
    ],
    '/powerfully/': [
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
            text: '硬件',
            items: [
                {
                    text: 'Vps',
                    link: '/powerfully/vps/',
                    items: [
                        {
                            text: 'DMIT 初始化',
                            link: '/powerfully/vps/',
                        },
                        {
                            text: 'Web服务',
                            link: '/powerfully/vps/web/',
                        },
                    ],
                },
                {
                    text: 'Nas',
                    link: '/powerfully/nas/OpenList/',
                    items: [
                        {
                            text: 'OpenList',
                            link: '/powerfully/nas/OpenList/',
                            items: [
                                {
                                    text: '网盘下载',
                                    link: '/powerfully/nas/OpenList/panDownload/',
                                },
                            ],
                        },
                    ],
                },
                {
                    text: 'Openwrt',
                    link: '/powerfully/openwrt/init.md',
                    items: [
                        {
                            text: '初始化',
                            link: '/powerfully/openwrt/init.md',
                        },
                        {
                            text: 'Zerotier',
                            link: '/powerfully/openwrt/zerotier/',
                        },
                    ],
                },
            ],
        },
    ],
    '/workflow/': [
        {
            text: 'JavaScript',
            items: [{ text: '数据类型', link: '/workflow/javascript/' }],
        },
        {
            text: 'HTML / CSS 相关',
            collapsed: false,
            items: [{ text: 'HTML 技巧', link: '/workflow/html/tricks' }],
        },
        {
            text: '工具链',
            collapsed: false,
            items: [{ text: 'Git', link: '/workflow/toolchain/git' }],
        },
    ],
    '/demo/': [
        {
            text: 'api-examples',
            link: '/demo/api-examples',
        },
        {
            text: 'markdown-examples',
            link: '/demo/markdown-examples',
        },
    ],
};
