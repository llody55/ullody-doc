## 简介

> Termshark 是由 [Graham Clark](https://github.com/gcla) 基于 Go 编写的一个命令行工具，提供了一个基于终端的用户界面，用于查看和分析网络数据包。
>
> 它是基于 tshark 的，并受 Wireshark 的启发。Termshark 可以帮助用户在终端环境中进行网络数据包的查看和调试，而无需使用图形界面。

## 安装

```bash
wget https://github.com/gcla/termshark/releases/download/v2.4.0/termshark_2.4.0_linux_x64.tar.gz

# 解压
tar xf termshark_2.4.0_linux_x64.tar.gz

# 授权
chmod +x termshark_2.4.0_linux_x64/termshark
cp termshark_2.4.0_linux_x64/termshark /usr/bin/
```

## 功能特点

>
> * 读取 pcap 文件或嗅探实时接口（仅在允许使用 tshark 的情况下）
> * 使用 Wireshark 的显示过滤器过滤 pcap 文件或实时捕获
> * 重新组装和检查 TCP 和 UDP 流
> * 按协议查看网络会话
> * 从终端复制数据包范围到剪贴板
> * 使用 Golang 编写，每个平台都编译为单个可执行文件 - 可在 Linux、macOS、BSD 变体、Android（termux）和 Windows 上下载


## 常见用法

```bash
# 读取 pcap 文件
termshark -r example.pcap

# 监听网络接口
termshark -i eth0

# 使用 Wireshark 的显示过滤器过滤 pcap 文件或实时捕获
termshark -r example.pcap -Y "http.request.method == GET"

# 重新组装和检查 TCP 和 UDP 流
termshark -r example.pcap -z follow,tcp,raw,10

# 按协议查看网络会话
termshark -r example.pcap -z conv,eth

# 从终端复制数据包范围到剪贴板
termshark -r example.pcap -o 'gui.copy_filter:tcp.analysis.flags == 0x002' -z packet,ip
```


## 相关竞品以及工具

>
> * [Wireshark](https://www.wireshark.org/)
>   Wireshark 是一个功能强大的网络数据包分析工具，提供了丰富的图形界面和功能，适用于各种操作系统。
> * [tshark](https://www.wireshark.org/docs/man-pages/tshark.html)
>   Tshark 是 Wireshark 的命令行版本，提供了与 Wireshark 类似的功能，适用于需要在命令行环境中进行网络数据包分析的场景。
> * [ngrep](https://github.com/jpr5/ngrep)
>   Ngrep 是一个用于网络流量匹配的命令行工具，支持正则表达式匹配，适用于捕获和分析网络数据包。

[文章转自](https://cn.x-cmd.com/pkg/termshark)
