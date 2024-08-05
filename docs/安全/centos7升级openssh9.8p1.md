## OpenSSH CVE-2024-6387漏洞说明及Centos7升级9.8p1处理方案

## 前言

> 2024 年 7 月，互联网公开披露了一个 **OpenSSH** 的远程代码执行漏洞（CVE-2024-6387）。鉴于该漏洞虽然利用较为困难但危害较大，建议所有使用受影响的企业尽快修复该漏洞。

## **以下为CentOS 7 升级操作记录**

### 确认当前版本

```bash
[root@nginx ~]# uname -a
Linux nginx 3.10.0-1160.119.1.el7.x86_64 #1 SMP Tue Jun 4 14:43:51 UTC 2024 x86_64 x86_64 x86_64 GNU/Linux
[root@nginx ~]# cat /etc/centos-release
CentOS Linux release 7.9.2009 (Core)
[root@nginx ~]# ssh -V
OpenSSH_7.4p1, OpenSSL 1.0.2k-fips  26 Jan 2017
```

### 下载软件包

```bash
wget https://www.openssl.org/source/old/1.1.1/openssl-1.1.1w.tar.gz
wget https://cdn.openbsd.org/pub/OpenBSD/OpenSSH/portable/openssh-9.8p1.tar.gz
```

> openssl地址：https://www.openssl.org/source/old/1.1.1/index.html
>
> openssh地址：https://cdn.openbsd.org/pub/OpenBSD/OpenSSH/portable/

### 安装依赖包

```bash
yum -y install gcc openssl-devel zlib-devel pam-devel
```

### 编译安装OpenSSL

```bash
# 备份openssl
[root@nginx openssl-1.1.1w]# mv /usr/bin/openssl /usr/bin/openssl-bak
# 解压
[root@nginx ~]# tar xf openssl-1.1.1w.tar.gz 
[root@nginx ~]# cd openssl-1.1.1w/
# 编译
[root@nginx openssl-1.1.1w]# ./config --prefix=/usr/local/openssl
[root@nginx openssl-1.1.1w]# make
[root@nginx openssl-1.1.1w]# make install
# 设置头路径
[root@nginx openssl-1.1.1w]# echo "/usr/local/openssl/lib/" >> /etc/ld.so.conf 
[root@nginx openssl-1.1.1w]# ldconfig
# 将新openssl连接到bin下
[root@nginx openssl-1.1.1w]# ln -s /usr/local/openssl/bin/openssl /usr/bin/openssl
设置环境变量
[root@nginx openssl-1.1.1w]# export LDFLAGS="-L/usr/local/openssl/lib"
[root@nginx openssl-1.1.1w]# export CPPFLAGS="-I/usr/local/openssl/include"
# 验证
[root@nginx ~]# openssl version
OpenSSL 1.1.1w  11 Sep 2023
```

> 遇到问题：
>
> 输出如下：
>
> ```bash
> [root@nginx openssl-1.1.1w]# openssl version
> OpenSSL 1.1.1w  11 Sep 2023 (Library: OpenSSL 1.1.1k  FIPS 25 Mar 2021)
> ```
>
> 检查**头路径**和**环境变量**是否设置成功

### 编译安装OpenSSH

```bash
[root@nginx ~]# tar xf openssh-9.8p1.tar.gz 
[root@nginx ~]# cd openssh-9.8p1/
[root@nginx openssh-9.8p1]# ./configure --prefix=/usr --sysconfdir=/etc/ssh --with-pam --with-ssl-engine=openssl
```

#### 输出如下信息

```bash
usr/bin/mkdir -p -m 0755 /var/empty
/usr/bin/install -c -m 0755 -s ssh /usr/bin/ssh
/usr/bin/install -c -m 0755 -s scp /usr/bin/scp
/usr/bin/install -c -m 0755 -s ssh-add /usr/bin/ssh-add
/usr/bin/install -c -m 0755 -s ssh-agent /usr/bin/ssh-agent
/usr/bin/install -c -m 0755 -s ssh-keygen /usr/bin/ssh-keygen
/usr/bin/install -c -m 0755 -s ssh-keyscan /usr/bin/ssh-keyscan
/usr/bin/install -c -m 0755 -s sshd /usr/sbin/sshd
/usr/bin/install -c -m 0755 -s sshd-session /usr/libexec/sshd-session
/usr/bin/install -c -m 4711 -s ssh-keysign /usr/libexec/ssh-keysign
/usr/bin/install -c -m 0755 -s ssh-pkcs11-helper /usr/libexec/ssh-pkcs11-helper
/usr/bin/install -c -m 0755 -s ssh-sk-helper /usr/libexec/ssh-sk-helper
/usr/bin/install -c -m 0755 -s sftp /usr/bin/sftp
/usr/bin/install -c -m 0755 -s sftp-server /usr/libexec/sftp-server
/usr/bin/install -c -m 644 ssh.1.out /usr/share/man/man1/ssh.1
/usr/bin/install -c -m 644 scp.1.out /usr/share/man/man1/scp.1
/usr/bin/install -c -m 644 ssh-add.1.out /usr/share/man/man1/ssh-add.1
/usr/bin/install -c -m 644 ssh-agent.1.out /usr/share/man/man1/ssh-agent.1
/usr/bin/install -c -m 644 ssh-keygen.1.out /usr/share/man/man1/ssh-keygen.1
/usr/bin/install -c -m 644 ssh-keyscan.1.out /usr/share/man/man1/ssh-keyscan.1
/usr/bin/install -c -m 644 moduli.5.out /usr/share/man/man5/moduli.5
/usr/bin/install -c -m 644 sshd_config.5.out /usr/share/man/man5/sshd_config.5
/usr/bin/install -c -m 644 ssh_config.5.out /usr/share/man/man5/ssh_config.5
/usr/bin/install -c -m 644 sshd.8.out /usr/share/man/man8/sshd.8
/usr/bin/install -c -m 644 sftp.1.out /usr/share/man/man1/sftp.1
/usr/bin/install -c -m 644 sftp-server.8.out /usr/share/man/man8/sftp-server.8
/usr/bin/install -c -m 644 ssh-keysign.8.out /usr/share/man/man8/ssh-keysign.8
/usr/bin/install -c -m 644 ssh-pkcs11-helper.8.out /usr/share/man/man8/ssh-pkcs11-helper.8
/usr/bin/install -c -m 644 ssh-sk-helper.8.out /usr/share/man/man8/ssh-sk-helper.8
/usr/bin/mkdir -p /etc/ssh
/etc/ssh/ssh_config already exists, install will not overwrite
/etc/ssh/sshd_config already exists, install will not overwrite
/etc/ssh/moduli already exists, install will not overwrite
/usr/sbin/sshd -t -f /etc/ssh/sshd_config
/etc/ssh/sshd_config line 80: Unsupported option GSSAPIAuthentication
/etc/ssh/sshd_config line 81: Unsupported option GSSAPICleanupCredentials
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@         WARNING: UNPROTECTED PRIVATE KEY FILE!          @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
Permissions 0640 for '/etc/ssh/ssh_host_rsa_key' are too open.
It is required that your private key files are NOT accessible by others.
This private key will be ignored.
Unable to load host key "/etc/ssh/ssh_host_rsa_key": bad permissions
Unable to load host key: /etc/ssh/ssh_host_rsa_key
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@         WARNING: UNPROTECTED PRIVATE KEY FILE!          @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
Permissions 0640 for '/etc/ssh/ssh_host_ecdsa_key' are too open.
It is required that your private key files are NOT accessible by others.
This private key will be ignored.
Unable to load host key "/etc/ssh/ssh_host_ecdsa_key": bad permissions
Unable to load host key: /etc/ssh/ssh_host_ecdsa_key
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@         WARNING: UNPROTECTED PRIVATE KEY FILE!          @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
Permissions 0640 for '/etc/ssh/ssh_host_ed25519_key' are too open.
It is required that your private key files are NOT accessible by others.
This private key will be ignored.
Unable to load host key "/etc/ssh/ssh_host_ed25519_key": bad permissions
Unable to load host key: /etc/ssh/ssh_host_ed25519_key
sshd: no hostkeys available -- exiting.
make: [check-config] Error 1 (ignored)
```

#### 这是权限问题，做如下处理

```bash
[root@nginx openssh-9.8p1]# chmod 600 /etc/ssh/ssh_host_rsa_key
[root@nginx openssh-9.8p1]# chmod 600 /etc/ssh/ssh_host_ecdsa_key
[root@nginx openssh-9.8p1]# chmod 600 /etc/ssh/ssh_host_ed25519_key
[root@nginx openssh-9.8p1]# systemctl restart sshd
```

### 验证

```bash
[root@nginx openssh-9.8p1]# systemctl status sshd
● sshd.service - OpenSSH server daemon
   Loaded: loaded (/usr/lib/systemd/system/sshd.service; enabled; vendor preset: enabled)
   Active: active (running) since Wed 2024-07-31 13:58:32 CST; 7s ago
     Docs: man:sshd(8)
           man:sshd_config(5)
 Main PID: 224416 (sshd)
    Tasks: 1
   Memory: 624.0K
   CGroup: /system.slice/sshd.service
           └─224416 sshd: /usr/sbin/sshd -D [listener] 0 of 10-100 startups

Jul 31 13:58:32 nginx systemd[1]: Starting OpenSSH server daemon...
Jul 31 13:58:32 nginx sshd[224416]: /etc/ssh/sshd_config line 80: Unsupported option GSSAPIAuthentication
Jul 31 13:58:32 nginx sshd[224416]: /etc/ssh/sshd_config line 81: Unsupported option GSSAPICleanupCredentials
Jul 31 13:58:32 nginx sshd[224416]: Server listening on 0.0.0.0 port 22.
Jul 31 13:58:32 nginx sshd[224416]: Server listening on :: port 22.
Jul 31 13:58:32 nginx systemd[1]: Started OpenSSH server daemon.
[root@nginx openssh-9.8p1]# ssh -V
OpenSSH_9.8p1, OpenSSL 1.1.1w  11 Sep 2023
```
