## 简介

> `ufw` （ 简单防火墙 Uncomplicated FireWall ）真正地简化了 [iptables](https://www.networkworld.com/article/2716098/working-with-iptables.html) ，它从出现的这几年，已经成为 Ubuntu 和 Debian 等系统上的默认防火墙。而且 `ufw` 出乎意料的简单，这对新管理员来说是一个福音，否则他们可能需要投入大量时间来学习防火墙管理。
>
> `ufw` 也有 GUI 客户端（例如 `gufw` ），但是 `ufw` 命令通常在命令行上执行的。本文介绍了一些使用 `ufw` 的命令，并研究了它的工作方式。

## 默认配置文件

> 首先，快速查看 `ufw` 配置的方法是查看其配置文件 —— `/etc/default/ufw` 。使用下面的命令可以查看其配置，使用 `grep` 来抑制了空行和注释（以 # 开头的行）的显示。

```bash
$ grep -v '^#\|^$' /etc/default/ufw
IPV6=yes
DEFAULT_INPUT_POLICY="DROP"
DEFAULT_OUTPUT_POLICY="ACCEPT"
DEFAULT_FORWARD_POLICY="DROP"
DEFAULT_APPLICATION_POLICY="SKIP"
MANAGE_BUILTINS=no
IPT_SYSCTL=/etc/ufw/sysctl.conf
IPT_MODULES="nf_conntrack_ftp nf_nat_ftp nf_conntrack_netbios_ns"

```

## 基本语法

```bash
ufw [--dry-run] [options] [rule syntax]
```

> `--dry-run` 选项意味着 `ufw` 不会运行你指定的命令，但会显示给你如果执行后的结果。但是它会显示假如更改后的整个规则集，因此你要做有好多行输出的准备。

## 检查 `ufw` 的状态

```bash
$ sudo ufw status
Status: active

To                         Action      From
--                         ------      ----
22                         ALLOW       192.168.0.0/24
9090                       ALLOW       Anywhere
9090 (v6)                  ALLOW       Anywhere (v6)

```

> sudo ufw status verbose   用于查看一些细节信息。

## 端口开放与关闭

```bash
$ sudo ufw allow 80         <== 允许 http 访问
$ sudo ufw deny 25              <== 拒绝 smtp 访问
```

## 阻止来自一个 IP 地址的连接

```bash
$ sudo ufw deny from 208.176.0.50
Rule added

```

## 允许从一个 IP 地址连接

```bash
sudo ufw allow from 208.176.0.50
```

## 允许特定子网的连接

```bash
sudo ufw allow from 123.45.67.89/24

```

## 允许特定 IP/ 端口的组合

```bash
sudo ufw allow from 123.45.67.89 to any port 22 proto tcp

```

## 删除规则

```bash
sudo ufw delete allow 80
```

## 端口号和服务名称之间的联系

```bash
$ grep 80/ /etc/services
http            80/tcp          www             # WorldWideWeb HTTP
socks           1080/tcp                        # socks proxy server
socks           1080/udp
http-alt        8080/tcp        webcache        # WWW caching service
http-alt        8080/udp
amanda          10080/tcp                       # amanda backup services
amanda          10080/udp
canna           5680/tcp                        # cannaserver

```

## 规则配置文件

```bash
$ ls -ltr /etc/ufw
total 48
-rw-r--r-- 1 root root 1391 Sep 19  2021 sysctl.conf
-rw-r----- 1 root root 6700 Jul 17  2023 before6.rules
-rw-r----- 1 root root 2537 Jul 17  2023 before.rules
-rw-r----- 1 root root  915 Jul 17  2023 after6.rules
-rw-r----- 1 root root 1004 Jul 17  2023 after.rules
-rw-r----- 1 root root  107 Feb 20  2024 user6.rules
-rw-r----- 1 root root  307 Feb 20  2024 user.rules
-rw-r--r-- 1 root root  312 Feb 20  2024 ufw.conf
-rw-r----- 1 root root 1130 Feb 20  2024 before.init
-rw-r----- 1 root root 1126 Feb 20  2024 after.init
drwxr-xr-x 2 root root 4096 Apr  2 15:27 applications.d
```

> `ufw` 遵循的规则存储在 `/etc/ufw` 目录中。注意，你需要 root 用户访问权限才能查看这些文件，每个文件都包含大量规则。

## 查看已添加规则

```bash
# grep " 80 " user*.rules
user6.rules:### tuple ### allow tcp 80 ::/0 any ::/0 in
user6.rules:-A ufw6-user-input -p tcp --dport 80 -j ACCEPT
user.rules:### tuple ### allow tcp 80 0.0.0.0/0 any 0.0.0.0/0 in
user.rules:-A ufw-user-input -p tcp --dport 80 -j ACCEPT
You have new mail in /var/mail/root
# grep 443 user*.rules
user6.rules:### tuple ### allow tcp 443 ::/0 any ::/0 in
user6.rules:-A ufw6-user-input -p tcp --dport 443 -j ACCEPT
user.rules:### tuple ### allow tcp 443 0.0.0.0/0 any 0.0.0.0/0 in
user.rules:-A ufw-user-input -p tcp --dport 443 -j ACCEPT

```

## 日志记录

```bash
sudo ufw logging on

```

> 可以通过运行 `sudo ufw logging low|medium|high` 设计日志级别，可以选择 `low` 、  `medium` 或者  `high` 。默认级别是 `low`
