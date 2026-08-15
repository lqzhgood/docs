# 初始化

## 备份

- 上网账号密码
- 启动脚本 `/etc/rc.local`
- 定时任务 `/etc/crontabs/root`
- 备份 `/root/*`
- 备份脚本 `/root/shell/tools/bak.sh`

## 固件

> 记得备份安装的固件

- [JDCloud-ax1800pro](https://github.com/lqzhgood/openwrt-ax1800pro-ci)
- [immortalwrt](https://firmware-selector.immortalwrt.org/)

## 恢复

### 软件包

<details>
    <summary>opkg apk 命令对照表</summary>

```shell
 OpenWrt recently switched to the "apk" package manager!

 OPKG Command           APK Equivalent      Description
 ------------------------------------------------------------------
 opkg install <pkg>     apk add <pkg>       Install a package
 opkg remove <pkg>      apk del <pkg>       Remove a package
 opkg upgrade           apk upgrade         Upgrade all packages
 opkg files <pkg>       apk info -L <pkg>   List package contents
 opkg list-installed    apk info            List installed packages
 opkg update            apk update          Update package lists
 opkg search <pkg>      apk search <pkg>    Search for packages
 ------------------------------------------------------------------

```

</details>

| ipk                                                                         | 描述       | 依赖                                                            |
| --------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------- |
| luci-theme-bootstrap                                                        | 经典皮肤   |                                                                 |
| luci-i18n-zerotier-zh-cn                                                    | zerotier   |                                                                 |
| luci-i18n-nfs-zh-cn                                                         | nfs 挂载   |         coreutils-timeout                                                        |
| luci-i18n-upnp-zh-cn                                                        | upnp       |                                                                 |
| [luci-app-wolplus](https://github.com/animegasan/luci-app-wolplus/releases) | wol 唤醒   |                                                                 |
| luci-i18n-vlmcsd-zh-cn                                                      | kms 激活   |                                                                 |
| [luci-app-netspeedtest](https://github.com/sirpdboy/luci-app-netspeedtest)  | 网速测试   |                                                                 |
| htop                                                                        | 任务管理器 |                                                                 |
|                                                                             |            |                                                                 |
| jq-full / jq                                                                | json 解析  | `/root/shell/lib/dnspod.sh` `/root/shell/tools/switch_clash.sh` |
| tar                                                                         | 全功能压缩 | `/root/shell/tools/bak.sh`                                      |
| curl                                                                        | 请求       | `/root/shell/agent/cpu.sh`                                      |
| msmtp                                                                       | 邮件       | `/root/update_ddns.sh`                                          |

### 设置

- 设置 wan、wifi
- @[Zerotier](zerotier/index.md)
- 初始化脚本 `/root/shell/tools/init.sh`

### DNS

#### 关闭重定向保护

![dns-allow-wan-lanip](./assets/dns-allow-wan-lanip.png)

<details>
    <summary>打开后使用 wan 口地址无法访问 lan 地址</summary>

如 `wan:1.1.1.1` -> `lan:192.168.1.1`， 输入 `1.1.1.1` 的时候会转为 `192.168.1.1` 即抛弃

```
想把*.foo.lan 都解析到 foo 对应的机器上，但是 dnsmasq 没有实现*的解析，退而求其次。

在阿里云的 dns 平台，把

*.foo.example.org 都解析到 foo 机器的 lanip 上

表现：

在外网访问 bar.foo.example.org 是正确的
在内网得不到解析结果
试了几次，只要解析到 192.168.0.0/16 10.0.0.0/8 的都解析不到
但是 local 的是可以的，127.0.0.0/8 是没问题的
求点解是哪个配置没做对
```

[https://www.v2ex.com/t/846507](https://www.v2ex.com/t/846507)

</details>
