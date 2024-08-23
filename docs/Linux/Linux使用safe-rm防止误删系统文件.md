## 前言

> `safe-rm` 是一款用来替代不安全 rm 的开源软件，可以在 `/etc/safe-rm.conf` 文件中配置保护名单，定义哪些文件不能被 rm 删除，可用于防止执行 `rm -rf` 命令导致文件被误删的发生。

## 安装 safe-rm 工具

> 0.x版本的是通过shell脚本来实现的，而1.x版本则通过rust来实现的，需要现编译。

### 下载安装

```bash

# 下载文件<span>（-c 的作用是可以断点续传）</span>
wget -c https://launchpadlibrarian.net/188958703/safe-rm-0.12.tar.gz
 
# 解压文件
tar -xvf safe-rm-0.12.tar.gz
 
# 拷贝可执行文件
cd safe-rm
cp safe-rm /bin/
 
# 建立软链接
mv /bin/rm /bin/rm.bak
ln -s /bin/safe-rm /bin/rm
```

### 创建 safe-rm 配置文件，添加保护名单

```bash
# 默认的safe-rm配置文件有以下两个，需要自行创建
 
全局配置：/etc/safe-rm.conf
用户配置：~/.safe-rm
 
# 创建全局配置文件
touch /etc/safe-rm.conf
 
# 添加保护名单
vim /etc/safe-rm.conf

/
/*
/etc
/etc/*
/usr
/usr/*
/usr/local
/usr/local/*
/usr/local/bin
/usr/local/bin/*
/bin/*
/boot/*
/dev/*
/etc/*
/home/*
/lib/*
/lib64/*
/media/*
/mnt/*
/opt/*
/proc/*
/root/*
/run/*
/sbin/*
/srv/*
/sys/*
/var/*
```

### 测试 save-rm 是否生效

```bash
# 创建测试文件
# touch /home/test.txt
 
# 追加需要保护的文件路径到配置文件中
# vim /etc/safe-rm.conf
/home/test.txt
 
# 测试删除受保护的文件路径，如果输出skipping日志代表safe-rm生效
# rm /home/test.txt
# rm -rf /home/test.txt
safe-rm: skipping /home/test.txt
 
# 注意：
# 配置文件里面的/etc只能保证执行"rm -rf /etc"命令的时候不能删除，但是如果执行"rm -rf /etc/app"，还是可以删除app文件的
# 如果想保证某个目录下面的所有文件都不被删除，则配置文件里可以写成/etc/*，但使用通配符的方式无法避免/etc目录下链接文件被删除
# 例如/lib或/lib64这种目录，下面会有很多库文件对应的链接文件，使用safe-rm并不能保护链接文件被删除
# 建议将/etc/safe-rm.conf加入到保护名单中，防止/etc/safe-rm.conf被删后配置失效
 
```
