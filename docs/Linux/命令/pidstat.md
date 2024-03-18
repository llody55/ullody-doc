## pidstat 概述

> pidstat是sysstat工具的一个命令，用于监控全部或指定进程的cpu、内存、线程、设备IO等系统资源的占用情况。pidstat首次运行时显示自系统启动开始的各项统计信息，之后运行pidstat将显示自上次运行该命令以后的统计信息。用户可以通过指定统计的次数和时间来获得所需的统计信息。

## pidstat 安装

pidstat 是sysstat软件套件的一部分，sysstat包含很多监控linux系统状态的工具，它能够从大多数linux发行版的软件源中获得。

* 在Debian/Ubuntu系统中可以使用下面的命令来安装:

```
apt-get install sysstat
```

* CentOS/Fedora/RHEL版本的linux中则使用下面的命令：

```
yum install sysstat
```

## pidstat 示例

### pidstat 的用法：

```
pidstat [ 选项 ] [ <时间间隔> ] [ <次数> ]
```

### 示例

```
# 每隔1秒输出一组数据，共输出5组
pidstat 1 5
```

### 参数

> 常用的参数：
>
>
> -u：默认的参数，显示各个进程的cpu使用统计
>
>
> -r：显示各个进程的内存使用统计
>
>
> -d：显示各个进程的IO使用情况
>
>
> -p：指定进程号
>
>
> -w：显示每个进程的上下文切换情况
>
>
> -t：显示选择任务的线程的统计信息外的额外信息
>
>
> -T { TASK | CHILD | ALL }
>
>
> 这个选项指定了pidstat监控的。TASK表示报告独立的task，CHILD关键字表示报告进程下所有线程统计信息。ALL表示报告独立的task和task下面的所有线程。
>
>
> 注意：task和子线程的全局的统计信息和pidstat选项无关。这些统计信息不会对应到当前的统计间隔，这些统计信息只有在子线程kill或者完成的时候才会被收集。
>
>
> -V：版本号
>
>
> -h：在一行上显示了所有活动，这样其他程序可以容易解析。
>
>
> -I：在SMP环境，表示任务的CPU使用率/内核数量
>
>
> -l：显示命令名和所有参数

### 示例一：查看所有进程的 CPU 使用情况（ -u -p ALL）

```
pidstat
或
pidstat -u -p ALL
```

> pidstat 和 pidstat -u -p ALL 是等效的。
>
> pidstat 默认显示了所有进程的cpu使用率。
>
> 详细说明
>
> PID：进程ID
>
>
> %usr：进程在用户空间占用cpu的百分比
>
> %system：进程在内核空间占用cpu的百分比
>
> %guest：进程在虚拟机占用cpu的百分比
>
> %CPU：进程占用cpu的百分比
>
> CPU：处理进程的cpu编号
>
> Command：当前进程对应的命令

### 示例二: cpu使用情况统计(-u)

```
pidstat -u
```

> 使用-u选项，pidstat将显示各活动进程的cpu使用统计，执行”pidstat -u”与单独执行”pidstat”的效果一样。

### 示例三： 内存使用情况统计(-r)

```
pidstat -r
```

> 使用-r选项，pidstat将显示各活动进程的内存使用统计
>
> PID：进程标识符
>
> Minflt/s:任务每秒发生的次要错误，不需要从磁盘中加载页
>
> Majflt/s:任务每秒发生的主要错误，需要从磁盘中加载页
>
> VSZ：虚拟地址大小，虚拟内存的使用KB
>
> RSS：常驻集合大小，非交换区五里内存使用KB
>
> Command：task命令名

### 示例四：显示每个进程的上下文切换情况（-w）

```
pidstat -w -p 28236
```

> PID:进程id
>
> Cswch/s:每秒主动任务上下文切换数量
>
> Nvcswch/s:每秒被动任务上下文切换数量
>
> Command:命令名

### 示例五：显示选择任务的线程的统计信息外的额外信息 (-t)

```
pidstat -t -p 28236
```

> TGID:主线程的表示
>
> TID:线程id
>
> %usr：进程在用户空间占用cpu的百分比
>
> %system：进程在内核空间占用cpu的百分比
>
> %guest：进程在虚拟机占用cpu的百分比
>
> %CPU：进程占用cpu的百分比
>
> CPU：处理进程的cpu编号
>
> Command：当前进程对应的命令

### 示例六：pidstat -T

```
pidstat -T TASK
pidstat -T CHILD
pidstat -T ALL

TASK表示报告独立的task。
CHILD关键字表示报告进程下所有线程统计信息。
ALL表示报告独立的task和task下面的所有线程。

注意：task和子线程的全局的统计信息和pidstat选项无关。这些统计信息不会对应到当前的统计间隔，这些统计信息只有在子线程kill或者完成的时候才会被收集。
```

> PID:进程id
>
> Usr-ms:任务和子线程在用户级别使用的毫秒数。
>
> System-ms:任务和子线程在系统级别使用的毫秒数。
>
> Guest-ms:任务和子线程在虚拟机(running a virtual processor)使用的毫秒数。
>
> Command:命令名
