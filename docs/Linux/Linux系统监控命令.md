## 查看进程占用带宽情况-Nethogs

> Nethogs 是一个终端下的网络流量监控工具可以直观的显示每个进程占用的带宽。
>
> 下载：[http://sourceforge.net/projects/nethogs/files/nethogs/0.8/nethogs-0.8.0.tar.gz/download](http://sourceforge.net/projects/nethogs/files/nethogs/0.8/nethogs-0.8.0.tar.gz/download)

```bash
[root@localhost ~]#yum  -y install libpcap-devel  ncurses-devel
[root@localhost ~]# tar zxvf nethogs-0.8.0.tar.gz
[root@localhost ~]# cd nethogs
[root@localhost nethogs]# make && make install
[root@localhost nethogs]# nethogs eth0
```

## 硬盘读取性能测试-IOZone

> IOZone是一款Linux文件系统性能测试工具 可以测试不同的操作系统中文件系统的读写性能。
>
> 下载：[http://www.iozone.org/src/current/](http://www.iozone.org/src/current/)

```bash
[root@localhost current]# tar xvf iozone3_420.tar
[root@localhost ~]# cd iozone3_420/src/current/
[root@localhost current]# make linux
[root@localhost current]# ./iozone -a -n 512m -g 16g -i 0 -i 1 -i 5 -f /mnt/iozone -Rb ./iozone.xls
```

> * -a使用全自动模式
> * -n为自动模式设置最小文件大小(Kbytes)。
> * -g设置自动模式可使用的最大文件大小Kbytes。
> * -i用来指定运行哪个测试。
> * -f指定测试文件的名字完成后自动删除
> * -R产生Excel到标准输出
> * -b指定输出到指定文件上

## 实时监控磁盘IO-IOTop

> IOTop命令是专门显示硬盘IO的命令,界面风格类似top命令。

```bash
[root@localhost ~]# yum -y install iotop
```

## 网络流量监控-IPtraf

> IPtraf 是一个运行在Linux下的简单的网络状况分析工具。

```bash
[root@localhost ~]# yum -y install iptraf
```

## 网络流量监控-IFTop

> iftop是类似于linux下面top的实时流量监控工具。比iptraf直观些。
>
> 下载：[http://www.ex-parrot.com/~pdw/iftop/](http://www.ex-parrot.com/~pdw/iftop/)

```bash
[root@localhost ~]# tar zxvf iftop-0.17.tar.gz
[root@localhost ~]# cd iftop-0.17 
[root@localhost iftop-0.17]# ./configure
[root@localhost iftop-0.17]# make && make install
[root@localhost iftop-0.17]# iftop 
[root@localhost iftop-0.17]# iftop -i eth0  #指定监控网卡接口
```

> * TX：发送流量
> * RX：接收流量
> * TOTAL：总流量
> * Cumm：运行iftop到目前时间的总流量
> * peak：流量峰值
> * rates：分别表示过去 2s 10s 40s 的平均流量

## 进程实时监控-HTop

> HTop 是一个 Linux 下的交互式的进程浏览器可以用来替换 Linux 下的top命令。

```
rpm -ivh http://pkgs.repoforge.org/rpmforge-release/rpmforge-release-0.5.2-2.el6.rf.x86_64.rpm（安装第三方YUM源）
[root@localhost ~]# yum -y install htop
```

## 系统资源监控-NMON

> NMON 是一种在 AIX 与各种 Linux 操作系统上广泛使用的监控与分析工具。
>
> 下载：[http://sourceforge.jp/projects/sfnet_nmon/releases/](http://sourceforge.jp/projects/sfnet_nmon/releases/)

```bash
[root@localhost ~]# chmod +x nmon_x86_64_rhel6
[root@localhost ~]# mv nmon_x86_64_rhel6 /usr/sbin/nmon
[root@localhost ~]# nmon
```

## 监控多个日志-MultiTail

> MultiTail 是在控制台打开多个窗口用来实现同时监控多个日志文档、类似 tail 命令的功能的软件。

```bash
rpm -ivh http://pkgs.repoforge.org/rpmforge-release/rpmforge-release-0.5.2-2.el6.rf.x86_64.rpm （安装第三方YUM源）

[root@localhost ~]# yum -y install  multitail
[root@localhost ~]# multitail -e "fail" /var/log/secure   #筛选关键字进行监控
[root@localhost ~]# multitail -l "ping baidu.com"   #监控后面的命令-l将要执行的命令
[root@localhost ~]# multitail -i /var/log/messages -i /var/log/secure   #-i指定一个文件名
```

## Web压力测试-Httperf

> Httperf 比 ab 更强大，能测试出 web 服务能承载的最大服务量及发现潜在问题；比如：内存使用、稳定性。最大优势：可以指定规律进行压力测试，模拟真实环境。
>
> 下载：[http://code.google.com/p/httperf/downloads/list](http://code.google.com/p/httperf/downloads/list)

```bash
[root@localhost ~]# tar zxvf httperf-0.9.0.tar.gz
[root@localhost ~]# cd httperf-0.9.0
[root@localhost httperf-0.9.0]# ./configure
[root@localhost httperf-0.9.0]# make && make install
[root@localhost ~]# httperf --hog --server=192.168.0.202 --uri=/index.html --num-conns=10000 --wsess=10,10,0.1
```

> 参数说明：
>
> * --hog：让 httperf 尽可能多产生连接，httperf 会根据硬件配置，有规律的产生访问连接；
> * --num-conns：连接数量，总发起 10000 请求；
> * --wsess：用户打开网页时间规律模拟，第一个10表示产生10个会话连接，第二个10表示每个会话连接进行10次请求，0.1表示每个会话连接请求之间的间隔时间/s。

## 系统性能分析工具:perf

```bash
yum install perf
```

> perf 是Linux的一款性能分析工具，能够进行函数级和指令级的热点查找，可以用来分析程序中热点函数的CPU占用率，从而定位性能瓶颈。
>
> 系统性能优化通常可以分为两个阶段：性能分析和性能优化。
>
> * 性能分析的目的是查找性能瓶颈、热点代码，分析引发性能问题的原因；
> * 基于性能分析，可以进行性能优化，包括：算法优化（空间复杂度和时间复杂度的权衡）和代码优化（提高执行速度、减少内存占用）。
