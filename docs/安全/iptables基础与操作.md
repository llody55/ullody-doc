## iptables 基础与操作

### 常用操作

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

### 自定义链

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

### 查看统计信息

```bash
iptables -nvL [INPUT|FORWARD|OUTPUT] --line-numbers | less
```
