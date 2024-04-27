## phistory

> 这是一个自定义命令，用于统计历史命令纪录中，命令的使用率。

## 编写规则

```bash
[root@dockui ~]# cat ~/.bashrc
# .bashrc

# User specific aliases and functions

alias rm='rm -i'
alias cp='cp -i'
alias mv='mv -i'

# Source global definitions
if [ -f /etc/bashrc ]; then
        . /etc/bashrc
fi
export PATH=/usr/local/python3/bin:$PATH

# 新增phistory自定义命令
alias phistory="history | awk '{CMD[\$2]++;count++} END { for (a in CMD)print CMD[a] \" \" CMD[a]/count*100 \"% \" a;}' | grep -v './' | column -c3 -s '' -t | sort -nr | nl | head -n15"
```

## 重载配置

```bash
source ~/.bashrc
```

## 效果展示

```bash
[root@dockui ~]# phistory 
     1  34 13.9344% docker
     2  18 7.37705% python3
     3  18 7.37705% cd
     4  17 6.96721% vim
     5  16 6.55738% source
     6  15 6.14754% git
     7  13 5.32787% ls
     8  10 4.09836% django-admin
     9  9 3.68852% ln
    10  9 3.68852% docsify
    11  8 3.27869% rm
    12  8 3.27869% pip3
    13  6 2.45902% tar
    14  6 2.45902% make
    15  5 2.04918% npm
```

> 统计命令使用次数，分析使用率。
