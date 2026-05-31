# AI 订阅指南

目前AI最强模型 ClaudeCode、Codex、Gemini 三家均对我国封锁，为师夷长技以制夷，简述购买使用方式，部分章节敏感词过多，请自行搜索关键词。

# 购买

目前基本有订阅和Api两种使用方式，订阅等同于包月付费，Api等同于按量付费。以 `claude`为例，订阅用量价格远远小于Api。

> 参考来源： [https://she-llac.com/claude-limits](https://she-llac.com/claude-limits)

|         | 订阅价格 | 用量换算为Api价格 |
| ------- | -------- | ----------------- |
| Pro     | $20      | $163              |
| Max 5x  | $100     | $1354             |
| Max 20x | $200     | $2708             |

但是订阅需要自行解决梯子、风控等问题，所以催生出了`中转站（二道贩子）`，以下Api均指中转站，而非官方Api。

两者使用区别如下：

> 如果你能官方购买Api，那么你也能购买订阅。以下Api均以中转站为例。

|          | 订阅                                                         | Api（中转站）             |
| -------- | ------------------------------------------------------------ | ------------------------- |
| 使用限制 | 每 5h 1w 有用量限制                                          | 无限制                    |
| 何处使用 | 仅支持官方客户端                                             | 任意，如小龙虾或自研agent |
| 增值服务 | 官方客户端支持额外功能，如： webSearch、电脑控制、浏览控制等 | 无                        |
| 支付方式 | 境外信用卡、ApplePay，GooglePay                              | 宽松，支付宝微信等        |
| 梯子     | 纯度高的固定IP                                               | 一般不需要                |
| 风险     | 账号被ban，kyc（境外版眨眼摇头）                             | 大部分假模型，投毒偷数据  |

总之订阅便宜功能多，只能在官方客户端使用且风控，Api无限制但鱼龙混杂假货多。

其中购买由难到易分别为：`Claude`、`Codex`、`Gemini`，以下以`Claude`为例，其他基本都差不多，分别说明两种的购买方式。

## 订阅

### 梯子

自行解决，最好是美西或新加坡ip，注意落地IP纯净，可以通过 [ippure](https://ippure.com/) 查看，实际体感并不追求家宽IP（有更好），只要不是万人骑的机场IP就行（如果你访问 Google 经常弹出校验，大概率不行）。尽量保证固定IP使用，避免频繁切换极易被风控。

> 我使用的是[DMIT](https://www.dmit.io/aff.php?aff=14976)自建梯子，Premium(CN2-GIA)线路，三个月了目前正常。

### 注册

优先推荐使用 Google 老号登录，大概率不需要手机号，如果被风控需要手机号登录，可以去接码平台找个临时手机号。

- <Badge type="tip" text="免费" /> [freereceivesms.com](https://www.freereceivesms.com/us/)
- <Badge type="danger" text="付费" /> [hero-sms.com](https://hero-sms.com/?ref=1012473)

### 支付方式

> 从易到难

:::warning

！！！若需要选择美国地区，应选择免税州：俄勒冈州 (Oregon)、特拉华州 (Delaware)、蒙大拿州 (Montana)、新罕布什尔州 (New Hampshire) 和阿拉斯加州 (Alaska)

:::

**美区国付**

> 感觉是 Apple 的 bug，不知道什么时候会修复
>
> ！！！此种方式购买 max 及以上套餐需要额外支付 $20 苹果税。
>
> 被 ban 退款到卡

将 `AppleId`切换到美国，下载`Claude`登录后，切换 `AppleId`到国内，然后内购购买订阅，使用国内支付即可。

**ApplePay / GooglePay**

> ！！！此种方式购买 max 及以上套餐需要额外支付 $20 苹果税。
>
> 被 ban 退款到卡

切换到美区，使用国内外币信用卡绑定苹果或谷歌然后支付。

**Apple / Google 礼品卡**

> ！！！此种方式购买 max 及以上套餐需要额外支付 $20 苹果税。
>
> 被 ban 退款到账户，黑卡锁号

切换到美区，购买礼品卡充值到 Apple / Google 账户，然后购买订阅。

::: details 支付宝就有美区礼品卡购买。

1. **切换支付宝定位**

   打开支付宝，点击左上角的“定位”图标。选择“国际/港澳台”，然后选择“北美洲”，接着选择“美国”，最后选择一个具体的城市（如旧金山、拉斯维加斯等）

2. **进入 Pockyt Shop**

   完成定位切换后，通常会在首页看到 Pockyt Shop 的入口。如果未显示，可以通过支付宝搜索栏直接输入“Pockyt Shop”并点击进入。

3. **购买美区礼品卡**

   点击 App Store & iTunes US 选项可自行输入需要充值的礼品卡金额，金额范围为 2~500。点击 Apple Gift Card US 选项则购买固定金额礼品卡。

:::

::: details 尼区 6 折

尼日利亚定价汇率低，约为美区 6 折。但大部分礼品卡为黑卡~

:::

**境外卡直付**

使用 `n26``wise`等国内可申的境外卡直接官网支付，这种方式没有苹果税，但申请难度较大。

**代付 / 成品号 **

这个风险较大，就不具体推荐了。

## API

中转站很多参水的，最简单测试有很多检测网站如：[relay-radar](https://github.com/AetherCore-Dev/relay-radar)

下面仅介绍绝对靠谱的几个中转站。

> Api 方式部分工具需要额外付费， 如 web search

[**OpenRouter**](https://openrouter.ai/)

全球最大的中转站，模型保真，价格官网+5.5%，但是会透传用户网络信息，所以还是需要科学环境下使用。

[**Vertex-ai**](https://docs.cloud.google.com/vertex-ai/)** （Google） / **[**aws**](https://aws.amazon.com/cn/bedrock/pricing/)** (亚马逊) / **[**microsoft-foundry**](https://azure.microsoft.com/en-us/pricing/details/microsoft-foundry/#pricing)** / (微软)**

价格对比 [pricing](https://platform.claude.com/docs/zh-CN/about-claude/pricing)

[**ZenMux**](https://zenmux.ai/invite/CT9D6D)

> 邀请码：CT9D6D 得 $5

蚂蚁自家开的，支持SLA赔付，也支持 Api 和订阅购买。

## Mix

既然订阅这么便宜，但需要稳定的IP。那我再服务器上跑 `Claude`然后通过 http 暴露 Api 不就能让 ip 一直固定且让其他软件也能使用了吗？

of course 靓仔，恭喜你发明了中转站。当然各厂商也想到了，**所以被抓的后果是直接封号**。

本地使用： [CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI) / 多人使用：[sub2api](https://github.com/Wei-Shaw/sub2api)

# 使用

## 自家使用

可以通过 [https://ip.skk.moe/split-tunnel](https://ip.skk.moe/split-tunnel) 测试网络情况。

### 本机proxy模式

开启梯子的 socks5 +http 代理模式，设置全局代理

```plain
export http_proxy="socks5://127.0.0.1:7890"
export https_proxy="socks5://127.0.0.1:7890"
export all_proxy="socks5://127.0.0.1:7890"   # 可选，全局兜底
```

**注意：**系统代理对于软件来说只是可选项，并不是开启系统代理===全局代理，如`Claude Desktop`和大部分 GUI 软件均不受系统代理影响（你开发软件有考虑支持用户代理网络么... =.=），而且 proxy 模式对 udp 流量支持也不好，也会有 DNS 泄露等问题。

### 本机tun模式

开启代理软件中的 tun 模式，相当于在本机新建一个虚拟网卡，接管设备上所有网络流量交给梯子软件分流，就可以避免软件不支持代理的情况。但同时也会带来额外的性能开销，多VPN环境下路由表冲突。

### 本机应用透明代理

我们还可以通过软件来接管其他软件的网络，windows 可以通过 [Proxifier ](https://www.proxifier.com/) ，MacOS 可以通过 [Antify](https://antifyapp.com/zh/) ，可以让不支持代理的应用也能通过代理连接网络。

### 软路由

将梯子架在路由器上，即可实现整个局域网的透明代理，无需关心设备是否支持。

梯子其实就是封包解包、加解密，纯纯的cpu密集运算，路由的硬件加速等均会失效（可以通过路由表将国内直连绕过梯子处理）。所以一个强大的cpu是必备的，SOC 性能可以参考 [https://mao.fan/socpk.html](https://mao.fan/socpk.html)，固件选择 [openwrt-ImmortalWrt](https://firmware-selector.immortalwrt.org/) 就行了，联发科兼容性较好。

咸鱼￥80可以买到 IPQ6000，大约可以支撑 200 Mbps 左右梯子带宽。
