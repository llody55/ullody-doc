## Linux `watch` 命令实践

> Linux中的 `watch`命令是一项非常实用的工具，它帮助用户重复执行命令，并实时显示输出结果。这个命令在监控系统变量或进程状态时尤为有用。

## 相关参数

```
[root@backup-db ~]# watch --help

Usage:
 watch [options] command

Options:
  -b, --beep             beep if command has a non-zero exit
  -c, --color            interpret ANSI color and style sequences
  -d, --differences[=<permanent>]
                         highlight changes between updates
  -e, --errexit          exit if command has a non-zero exit
  -g, --chgexit          exit when output from command changes
  -n, --interval <secs>  seconds to wait between updates
  -p, --precise          attempt run command in precise intervals
  -t, --no-title         turn off header
  -x, --exec             pass command to exec instead of "sh -c"

 -h, --help     display this help and exit
 -v, --version  output version information and exit

For more details see watch(1).
```

> 默认情况下每2秒刷新一次，可以通过 `-n` 修改频率

## 相关用法

```
# 监控内存变化
watch -n 1  -t -d free -mh    # 输出内存命令，每秒进行刷新：-n， 去掉顶部时间标题: -t  ,高亮显示变化: -d
# 循环输出时间
watch -n 1 uptime

```
