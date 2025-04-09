# iptables 基础与操作

## 基础命令

### 基本语法：

```
iptables(选项)(参数)
```

基本选项说明：

| 参数        | 作用                                              |
| ----------- | ------------------------------------------------- |
| -P          | 设置默认策略:iptables -P INPUT (DROP              |
| -F          | 清空规则链                                        |
| -L          | 查看规则链                                        |
| -A          | 在规则链的末尾加入新规则                          |
| -I          | num 在规则链的头部加入新规则                      |
| -D          | num 删除某一条规则                                |
| -s          | 匹配来源地址 IP/MASK，加叹号"!"表示除这个 IP 外。 |
| -d          | 匹配目标地址                                      |
| -i          | 网卡名称 匹配从这块网卡流入的数据                 |
| -o          | 网卡名称 匹配从这块网卡流出的数据                 |
| -p          | 匹配协议,如 tcp,udp,icmp                          |
| --dport num | 匹配目标端口号                                    |
| --sport num | 匹配来源端口号                                    |

顺序：

```
iptables -t 表名 <-A/I/D/R> 规则链名 [规则号] <-i/o 网卡名> -p 协议名 <-s 源IP/源子网> --sport 源端口 <-d 目标IP/目标子网> --dport 目标端口 -j 动作
```

#### iptables 示例

#### 清空当前的所有规则和计数

```shell
iptables -F  # 清空所有的防火墙规则
iptables -X  # 删除用户自定义的空链
iptables -Z  # 清空计数
```

#### 配置允许 ssh 端口连接

```shell
iptables -A INPUT -s 192.168.1.0/24 -p tcp --dport 22 -j ACCEPT
# 22为你的ssh端口， -s 192.168.1.0/24表示允许这个网段的机器来连接，其它网段的ip地址是登陆不了你的机器的。 -j ACCEPT表示接受这样的请求
```

#### 允许本地回环地址可以正常使用

```shell
iptables -A INPUT -i lo -j ACCEPT
#本地圆环地址就是那个127.0.0.1，是本机上使用的,它进与出都设置为允许
iptables -A OUTPUT -o lo -j ACCEPT
```

#### 设置默认的规则

```shell
iptables -P INPUT DROP # 配置默认的不让进
iptables -P FORWARD DROP # 默认的不允许转发
iptables -P OUTPUT ACCEPT # 默认的可以出去
```

#### 配置白名单

```shell
iptables -A INPUT -p all -s 192.168.1.0/24 -j ACCEPT  # 允许机房内网机器可以访问
iptables -A INPUT -p all -s 192.168.140.0/24 -j ACCEPT  # 允许机房内网机器可以访问
iptables -A INPUT -p tcp -s 183.121.3.7 --dport 3380 -j ACCEPT # 允许183.121.3.7访问本机的3380端口
```

#### 开启相应的服务端口

```shell
iptables -A INPUT -p tcp --dport 80 -j ACCEPT # 开启80端口，因为web对外都是这个端口
iptables -A INPUT -p icmp --icmp-type 8 -j ACCEPT # 允许被ping
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT # 已经建立的连接得让它进来
```

#### 保存规则到配置文件中

```shell
cp /etc/sysconfig/iptables /etc/sysconfig/iptables.bak # 任何改动之前先备份，请保持这一优秀的习惯
iptables-save > /etc/sysconfig/iptables
cat /etc/sysconfig/iptables
```

#### 列出已设置的规则

> iptables -L [-t 表名][链名]

* 四个表名 `raw`，`nat`，`filter`，`mangle`
* 五个规则链名 `INPUT`、`OUTPUT`、`FORWARD`、`PREROUTING`、`POSTROUTING`
* filter 表包含 `INPUT`、`OUTPUT`、`FORWARD`三个规则链

```shell
iptables -L -t nat                  # 列出 nat 上面的所有规则
#            ^ -t 参数指定，必须是 raw， nat，filter，mangle 中的一个
iptables -L -t nat  --line-numbers  # 规则带编号
iptables -L INPUT

iptables -L -nv  # 查看，这个列表看起来更详细
```

#### 清除已有规则

```shell
iptables -F INPUT  # 清空指定链 INPUT 上面的所有规则
iptables -X INPUT  # 删除指定的链，这个链必须没有被其它任何规则引用，而且这条上必须没有任何规则。
                   # 如果没有指定链名，则会删除该表中所有非内置的链。
iptables -Z INPUT  # 把指定链，或者表中的所有链上的所有计数器清零。
```

#### 删除已添加的规则

```shell
# 添加一条规则
iptables -A INPUT -s 192.168.1.5 -j DROP
```

将所有 iptables 以序号标记显示，执行：

```shell
iptables -L -n --line-numbers
```

比如要删除 INPUT 里序号为 8 的规则，执行：

```shell
iptables -D INPUT 8
```

#### 开放指定的端口

```shell
iptables -A INPUT -s 127.0.0.1 -d 127.0.0.1 -j ACCEPT               #允许本地回环接口(即运行本机访问本机)
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT    #允许已建立的或相关连的通行
iptables -A OUTPUT -j ACCEPT         #允许所有本机向外的访问
iptables -A INPUT -p tcp --dport 22 -j ACCEPT    #允许访问22端口
iptables -A INPUT -p tcp --dport 80 -j ACCEPT    #允许访问80端口
iptables -A INPUT -p tcp --dport 21 -j ACCEPT    #允许ftp服务的21端口
iptables -A INPUT -p tcp --dport 20 -j ACCEPT    #允许FTP服务的20端口
iptables -A INPUT -j reject       #禁止其他未允许的规则访问
iptables -A FORWARD -j REJECT     #禁止其他未允许的规则访问
```

#### 屏蔽 IP

```shell
iptables -A INPUT -p tcp -m tcp -s 192.168.0.8 -j DROP  # 屏蔽恶意主机（比如，192.168.0.8
iptables -I INPUT -s 123.45.6.7 -j DROP       #屏蔽单个IP的命令
iptables -I INPUT -s 123.0.0.0/8 -j DROP      #封整个段即从123.0.0.1到123.255.255.254的命令
iptables -I INPUT -s 124.45.0.0/16 -j DROP    #封IP段即从123.45.0.1到123.45.255.254的命令
iptables -I INPUT -s 123.45.6.0/24 -j DROP    #封IP段即从123.45.6.1到123.45.6.254的命令是
```

#### 指定数据包出去的网络接口

只对 OUTPUT，FORWARD，POSTROUTING 三个链起作用。

```shell
iptables -A FORWARD -o eth0
```

#### 查看已添加的规则

```shell
iptables -L -n -v
Chain INPUT (policy DROP 48106 packets, 2690K bytes)
 pkts bytes target     prot opt in     out     source               destination
 5075  589K ACCEPT     all  --  lo     *       0.0.0.0/0            0.0.0.0/0
 191K   90M ACCEPT     tcp  --  *      *       0.0.0.0/0            0.0.0.0/0           tcp dpt:22
1499K  133M ACCEPT     tcp  --  *      *       0.0.0.0/0            0.0.0.0/0           tcp dpt:80
4364K 6351M ACCEPT     all  --  *      *       0.0.0.0/0            0.0.0.0/0           state RELATED,ESTABLISHED
 6256  327K ACCEPT     icmp --  *      *       0.0.0.0/0            0.0.0.0/0

Chain FORWARD (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination

Chain OUTPUT (policy ACCEPT 3382K packets, 1819M bytes)
 pkts bytes target     prot opt in     out     source               destination
 5075  589K ACCEPT     all  --  *      lo      0.0.0.0/0            0.0.0.0/0
```

#### 启动网络转发规则

公网 `210.14.67.7`让内网 `192.168.188.0/24`上网

```shell
iptables -t nat -A POSTROUTING -s 192.168.188.0/24 -j SNAT --to-source 210.14.67.127
```

#### 端口映射

本机的 2222 端口映射到内网 虚拟机的 22 端口

```shell
iptables -t nat -A PREROUTING -d 210.14.67.127 -p tcp --dport 2222  -j DNAT --to-dest 192.168.188.115:22
```

#### 字符串匹配

比如，我们要过滤所有 TCP 连接中的字符串 `test`，一旦出现它我们就终止这个连接，我们可以这么做：

```shell
iptables -A INPUT -p tcp -m string --algo kmp --string "test" -j REJECT --reject-with tcp-reset
iptables -L

# Chain INPUT (policy ACCEPT)
# target     prot opt source               destination
# REJECT     tcp  --  anywhere             anywhere            STRING match "test" ALGO name kmp TO 65535 reject-with tcp-reset
#
# Chain FORWARD (policy ACCEPT)
# target     prot opt source               destination
#
# Chain OUTPUT (policy ACCEPT)
# target     prot opt source               destination
```

#### 阻止 Windows 蠕虫的攻击

```shell
iptables -I INPUT -j DROP -p tcp -s 0.0.0.0/0 -m string --algo kmp --string "cmd.exe"
```

#### 防止 SYN 洪水攻击

```shell
iptables -A INPUT -p tcp --syn -m limit --limit 5/second -j ACCEPT
```

## 常用操作

```bash
# 列出规则 -v 显示详细信息，-x 显示计数器精确值，-L 后不跟链名则显示表中所有链的规则，-n 不进行地址反解
iptables --line-numbers -nvx -t filter -L INPUT
# 在指定链的末尾添加规则
iptables -t filter -A INPUT -s 192.168.1.146 -j DROP
# 在指定链的首部添加规则
iptables -t filter -I INPUT -s 192.168.1.146 -j DROP
# 在指定行添加规则
iptables -t filter -I INPUT 3 -s 192.168.1.146 -j DROP
# 删除指定行
iptables -t filter -D INPUT 3
# 删除匹配行，若有多个匹配规则只会删除第一个
iptables -t filter -D INPUT -s 192.168.1.146 -j DROP
# 删除指定链中的所有规则
iptables -t filter -F INPUT
# 删除指定表中的所有规则
iptables -t filter -F
# 导出规则到本地文件
iptables-save > /tmp/rules
# 从本地文件恢复规则
iptables-restore < /tmp/rules
# 指定报文流入的网卡进行过滤，-i 表示从哪个网卡流入，只有 PREOUTING/INPUT/FORWARD 链上能够使用
iptables -t filter -i eth0 -I INPUT -d 192.168.1.8 -p tcp -m tcp --dport 8080 -j DROP
iptables -t filter -i eth0 -I INPUT -s 192.168.1.8 -p tcp --dport 8000:8080 -j DROP
# 指定报文流出的网卡， -o 表示从哪个网卡流出，只有 FOREWARD/OUTPUT/POSTROUTING 链上能够使用
iptables -t filter -o eth0 -I OUTPUT -d 192.168.1.8,192.168.3.4 -p tcp -m multiport --dports 8081,8893 -j DROP
iptables -t filter -o eth0 -I OUTPUT -s 192.168.1.0/24 -p tcp -m multiport --dports 8081,8893 -j DROP
# 指定一段连续的地址
iptables -t filter -I OUTPUT -m iprange --src-range 192.168.1.33-192.168.1.88 -p tcp -m multiport --dports 8081,8893 -j DROP
# 匹配字符串
iptables -t filter -I INPUT -p tcp --sport 80 -m string --algo bm --string "dststr" -j REJECT
# 限制连接数
iptables -t filter -I INPUT -p tcp --dport 22 -m connlimit --connlimit-above 10 -j REJECT
# 限制请求速率
iptables -t filter -I INPUT -p icmp -m limit --limit-burst 3 --limit 10/second -j ACCEPT
# 根据 tcp-flag 限制请求包
iptables -t filter -I INPUT -s 192.168.1.4 -p tcp -m tcp --dport 22 --tcp-flags SYN,ACK,FIN,RST,URG,PSH SYN -j REJECT
iptables -t filter -I INPUT -s 192.168.1.4 -p tcp -m tcp --dport 22 --tcp-flags ALL SYN,ACK -j REJECT
iptables -t filter -I INPUT -s 192.168.1.4 -p tcp -m tcp --dport 22 --syn -j REJECT
# 禁止别人 ping 本机
iptables -t filter -I INPUT -p icmp -m icmp --icmp-type 8/0 -j REJECT
# 放行指定连接状态的数据包，注意这里的连接状态指的是 conntrack 表中维护的每一个连接的状态，而不是 TCP 协议的状态，conntrack 对 UDP 和 ICMP 同样维护有状态
iptables -t filter -I INPUT -p tcp -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
```

## 自定义链

```bash
# 创建自定义链
iptables -t filter -N NEW_CHAIN
# 向自定义链添加规则
iptables -t filter -I NEW_CHAIN -s 192.168.3.55 -p tcp --dport 80 -j DROP
# 必须在默认链中引用自定义链才能生效
iptables -t filter -I INPUT -j NEW_CHAIN
# 删除自定义链需要先删除对它的引用并清空其中规则
iptables -D INPUT 1
iptables -F NEW_CHAIN
iptables -X NEW_CHAIN
```

## 负载平衡

> 可以利用 iptables 的 **-m nth** 扩展，及其参数（–counter 0 –every 3 –packet x），进行 DNAT 路由设置（-A PREROUTING -j DNAT –to-destination），从而将负载平均分配给 3 台服务器：

```bash
iptables -A PREROUTING -i eth0 -p tcp --dport 443 -m state --state NEW -m nth --counter 0 --every 3 --packet 0 -j DNAT --to-destination 192.168.1.101:443
iptables -A PREROUTING -i eth0 -p tcp --dport 443 -m state --state NEW -m nth --counter 0 --every 3 --packet 1 -j DNAT --to-destination 192.168.1.102:443
iptables -A PREROUTING -i eth0 -p tcp --dport 443 -m state --state NEW -m nth --counter 0 --every 3 --packet 2 -j DNAT --to-destination 192.168.1.103:443

```

## 查看统计信息

```bash
iptables -nvL [INPUT|FORWARD|OUTPUT] --line-numbers | less
```
