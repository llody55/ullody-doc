## 办公网络与Docker内网网络互通

> 在使用docker部署微服务时，调试报错时，如果要让研发人员可以将办公网络的服务注册到docker内网，让docker内网网络可以转发至办公网络进行断点调试。

## 网络基本情况

| 网络类型   | IP段           |
| ---------- | -------------- |
| 办公网络   | 192.168.1.0/24 |
| Docker网卡 | 172.18.0.0/16  |

## 前提条件

### **启用 IP 转发**

> 允许节点转发流量可能需要编辑 `/etc/sysctl.conf` 文件来启用 IP 转发
>
> 如果输出不是 `1`，则需要启用 IP 转发。你可以通过编辑 `/etc/sysctl.conf` 添加 `net.ipv4.ip_forward=1`，然后运行 `sysctl -p` 来启用。

```bash
net.ipv4.ip_forward=1
```

```bash
[root@dev-2 ~]# sysctl -a |grep ip_forward
net.ipv4.ip_forward = 1
net.ipv4.ip_forward_use_pmtu = 0
sysctl: reading key "net.ipv6.conf.all.stable_secret"
sysctl: reading key "net.ipv6.conf.br-7afa34df7dc1.stable_secret"
sysctl: reading key "net.ipv6.conf.default.stable_secret"
sysctl: reading key "net.ipv6.conf.docker0.stable_secret"
sysctl: reading key "net.ipv6.conf.eth0.stable_secret"
sysctl: reading key "net.ipv6.conf.lo.stable_secret"
sysctl: reading key "net.ipv6.conf.veth0b77e3d.stable_secret"
sysctl: reading key "net.ipv6.conf.veth11a6734.stable_secret"
sysctl: reading key "net.ipv6.conf.veth17e6c89.stable_secret"
```

## iptables 规则

```bash
[root@dev-2 ~]# iptables -A FORWARD -s 192.168.1.0/24 -d 172.18.0.0/16 -j ACCEPT
[root@dev-2 ~]# iptables -A FORWARD -d 192.168.1.0/24 -s 172.18.0.0/16 -j ACCEPT
[root@dev-2 ~]# iptables -t nat -A POSTROUTING -s 172.18.0.0/16 -d 192.168.1.0/24 -j MASQUERADE
[root@dev-2 ~]# ip route show 
default via 192.168.1.1 dev eth0 proto static metric 100 
172.17.0.0/16 dev docker0 proto kernel scope link src 172.17.0.1 
172.18.0.0/16 dev br-7afa34df7dc1 proto kernel scope link src 172.18.0.1 
192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.218 metric 100 
```

## 路由器配置

### 配置静态路由

![1713424455960](https://static.llody.top/ullody-doc/images/docker%E8%B7%AF%E7%94%B1.png)

## 终端测试

![1713424544610](https://static.llody.top/ullody-doc/images/dockerping.png)

## 说明

> 如果你使用默认的 `bridge` 网络而没有做任何修改，通常不需要额外配置。但如果你创建了自定义的 Docker 网络，确保它的网络配置不与你的本地网络冲突，并且需要类似地更新路由和 `iptables` 规则，我当前使用的就是docker的默认网络空间。
