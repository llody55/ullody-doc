## Linux系统服务器安全加固

### 减缓SYN flood危害

减少发送syn+ack包时重试次数(默认是10)

```
sysctl -w net.ipv4.tcp_synack_retries = 3
sysctl -w net.ipv4.tcp_syn_retries = 312
SYN cookies技术
synctl -w net.ipv4.tcp_syncookies = 11
```

增加backlog队列

```
synctl -w net.ipv4.tcp_max_syv_backlog = 20481
```

### 抵抗扫描

禁掉ICMP包，让主机不能被ping

```
sysctl -w net.ipv4.icmp_echo_ignore_all = 11
```

通过iptables防止扫描

```
iptables -A FORWARD -p tcp -syn -m limit -limit 1/s -limit-burst 5 -j ACCEPT
iptables -A FORWARD -p tcp -tcp-flags SYN,ACK,FIN,RST RST -m limit -limit 1/s -j ACCEPT
iptables -A FORWARD -p icmp -icmp-type echo-request -m limit -limit 1/s -j ACCEPT
```

### 账户安全

#### 锁定系统中多余的自建帐号

检查方法

```
cat /etc/passwd
cat /etc/shadow
```

> 查看账户、口令文件，与系统管理员确认不必要的账号。对于一些保留的系统伪帐户如：bin, sys，adm，uucp，lp, nuucp，hpdb, www, daemon等可根据需要锁定登陆。

备份方法

```
cp -p /etc/passwd /etc/passwd_bak
cp -p /etc/shadow /etc/shadow_bak
```

加固方法

> 使用命令passwd -l <用户名>锁定不必要的账号。
>
> 使用命令passwd -u <用户名>解锁需要恢复的账号。

#### 设置系统口令策略

检查方法

```
cat /etc/login.defs|grep PASS查看密码策略设置
```

加固方法

```
vi /etc/login.defs修改配置文件

PASS_MAX_DAYS 90 #新建用户的密码最长使用天数
PASS_MIN_DAYS 0 #新建用户的密码最短使用天数
PASS_WARN_AGE 7 #新建用户的密码到期提前提醒天数
PASS_MIN_LEN 9 #最小密码长度9
```

#### 禁用root之外的超级用户

检查方法

```
cat /etc/passwd 查看口令文件，口令文件格式如下：

login_name：password：user_ID：group_ID：comment：home_dir：command
login_name：用户名
password：加密后的用户密码
user_ID：用户ID，(1 ~ 6000) 若用户ID=0，则该用户拥有超级用户的权限。查看此处是否有多个ID=0。
group_ID：用户组ID
comment：用户全名或其它注释信息
home_dir：用户根目录
command：用户登录后的执行命令
```

加固方法

> 使用命令passwd -l <用户名>锁定不必要的超级账户。
>
> 使用命令passwd -u <用户名>解锁需要恢复的超级账户。
>
> 风险：需要与管理员确认此超级用户的用途。

#### 限制能够su为root的用户

检查方法

```
cat /etc/pam.d/su,查看是否有auth required /lib/security/pam_wheel.so这样的配置条目
```

加固方法

```
vi /etc/pam.d/su

#在头部添加：
auth required /lib/security/pam_wheel.so group=wheel
这样，只有wheel组的用户可以su到root
#usermod -G10 test 将test用户加入到wheel组
当系统验证出现问题时，首先应当检查/var/log/messages或者/var/log/secure中的输出信息，根据这些信息判断用户账号的有效性。如果是因为PAM验证故障，而引起root也无法登录，只能使用single user或者rescue模式进行排错。
```

#### 检查shadow中空口令帐号

检查方法

```
awk -F: '( == "") { print }' /etc/shadow
备份方法：cp -p /etc/shadow /etc/shadow_bak
加固方法：对空口令账号进行锁定，或要求增加密码
```

### 最小化服务

#### 停止或禁用与承载业务无关的服务

检查方法

```
who –r或runlevel 查看当前init级别
chkconfig --list 查看所有服务的状态
备份方法：记录需要关闭服务的名称
```

加固方法

```
chkconfig --level <服务名> on|off|reset 设置服务在个init级别下开机是否启动
```

### 数据访问控制

#### 设置合理的初始文件权限

检查方法

```
cat /etc/profile 查看umask的值
```

加固方法

```
vi /etc/profile
umask=027
风险：会修改新建文件的默认权限，如果该服务器是WEB应用，则此项谨慎修改。
```

### 网络访问控制

#### 使用SSH进行管理

检查方法

```
ps –aef | grep sshd 查看有无此服务
```

加固方法

```
# 使用命令开启ssh服务
service sshd start
```

> 风险：改变管理员的使用习惯

#### 设置访问控制策略限制能够管理本机的IP地址

检查方法

```
cat /etc/ssh/sshd_config 查看有无AllowUsers的语句
```

加固方法

```
vi /etc/ssh/sshd_config，添加以下语句
AllowUsers *@10.138.*.* 此句意为：仅允许10.138.0.0/16网段所有用户通过ssh访问
保存后重启ssh服务
service sshd restart
风险：需要和管理员确认能够管理的IP段
```

#### 禁止root用户远程登陆

检查方法

```
cat /etc/ssh/sshd_config 查看PermitRootLogin是否为no
```

加固方法

```
vi /etc/ssh/sshd_config
PermitRootLogin no
保存后重启ssh服务
service sshd restart
```

#### 限定信任主机

检查方法

```
cat /etc/hosts.equiv 查看其中的主机
cat /$HOME/.rhosts 查看其中的主机
```

加固方法

```
vi /etc/hosts.equiv 删除其中不必要的主机
vi /$HOME/.rhosts 删除其中不必要的主机
风险：在多机互备的环境中，需要保留其他主机的IP可信任。
```

#### 防止误使用Ctrl+Alt+Del重启系统

检查方法

```
cat /etc/inittab|grep ctrlaltdel 查看输入行是否被注释
```

加固方法

```
vi /etc/inittab
在行开头添加注释符号“#”
ca::ctrlaltdel:/sbin/shutdown -t3 -r now
```

### 用户鉴别

#### 设置帐户锁定登录失败锁定次数、锁定时间

检查方法

```
cat /etc/pam.d/system-auth 查看有无auth required pam_tally.so条目的设置
```

加固方法

```
vi /etc/pam.d/system-auth
auth required pam_tally.so onerr=fail deny=6 unlock_time=300 设置为密码连续错误6次锁定，锁定时间300秒
解锁用户 faillog -u <用户名> -r
风险：需要PAM包的支持;对pam文件的修改应仔细检查，一旦出现错误会导致无法登陆;
当系统验证出现问题时，首先应当检查/var/log/messages或者/var/log/secure中的输出信息，根据这些信息判断用户账号的有效性。
```

#### 修改帐户TMOUT值，设置自动注销时间

```
vi /etc/profile
TMOUT=600 无操作600秒后自动退出
```

#### 限制FTP登录

检查方法

```
cat /etc/ftpusers 确认是否包含用户名，这些用户名不允许登录FTP服务
```

加固方法

```
vi /etc/ftpusers 添加行，每行包含一个用户名，添加的用户将被禁止登录FTP服务
```

#### 设置Bash保留历史命令的条数

检查方法

```
cat /etc/profile|grep HISTSIZE=
cat /etc/profile|grep HISTFILESIZE= 查看保留历史命令的条数
```

加固方法

```
vi /etc/profile
修改HISTSIZE=5和HISTFILESIZE=5即保留最新执行的5条命令
```

### 审计策略

#### 配置系统日志策略配置文件

检查方法

```
ps –aef | grep syslog 确认syslog是否启用
cat /etc/syslog.conf 查看syslogd的配置，并确认日志文件是否存在
系统日志(默认)/var/log/messages
cron日志(默认)/var/log/cron
安全日志(默认)/var/log/secure
```

#### 为审计产生的数据分配合理的存储空间和存储时间

检查方法

```
cat /etc/logrotate.conf 查看系统轮询配置，有无
# rotate log files weekly
weekly
# keep 4 weeks worth of backlogs
rotate 4 的配置
```

加固方法

```
vi /etc/logrotate.d/syslog

增加
rotate 4 日志文件保存个数为4，当第5个产生后，删除最早的日志
size 100k 每个日志的大小
加固后应类似如下内容：
/var/log/syslog/*_log {
　　missingok
　　notifempty
　　size 100k # log files will be rotated when they grow bigger that 100k.
　　rotate 5 # will keep the logs for 5 weeks.
　　compress # log files will be compressed.
　　sharedscripts
　　postrotate
　　/etc/init.d/syslog condrestart >/dev/null 2>1 || true
　　endscript
}
```

### 使用非root账号登陆实例

描述

> 如果您使用系统用户root登录Linux操作系统的ECS实例，则可以获取系统最大权限。该方式虽然便于您进行系统运维操作，但如果ECS实例被入侵，则会存在影响严重的数据安全风险。

加固建议

> 1、创建新账号 ecs-user adduser ecs-user 
>
> 2、为新账户设置密码 passwd ecs-user 
>
> 3、确认ecs-user账户可正常登录使用 
>
> 4、给新帐号添加免密sudo权限 vim /etc/sudoers 在root ALL=(ALL) ALL 下面一行添加一行 ecs-user ALL=(ALL) NOPASSWD:ALL 
>
> 5、限制root 登陆 编辑SSH 的配置文件 /etc/ssh/sshd_config 找到 'PermitRootLogin' 配置项 设置为 'PermitRootLogin no' 若没有则手动新增操作时建议做好记录或备份

### Linux系统防止黑客扫描方法

> iptables -F
>
> iptables -A INPUT -p tcp --tcp-flags ALL FIN,URG,PSH -j Drop
>
> iptables -A INPUT -p tcp --tcp-flags SYN,RST SYN,RST -j Drop
>
> iptables -A INPUT -p tcp --tcp-flags SYN,FIN SYN,FIN -j Drop
>
> iptables -A INPUT -p tcp --tcp-flags SYN,SYN --dport 80 -j Drop
>
> 运行以上命令后，Linux会过滤来自NMAP的扫描信息，黑客就不能获取活动的TCP端口和操作系统的版本等信息，服务器就安全一些了。
