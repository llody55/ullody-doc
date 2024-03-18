## SHA

```
date +%s |sha256sum |base64 |head -c 10 ;echo
```

> 使用SHA算法来加密日期，并输出结果的前10个字符

## urandom

```
#tr参数
-c或——complerment：取代所有不属于第一字符集的字符；
-d或——delete：删除所有属于第一字符集的字符；
1.生成10个小写字母
[root@llody55 shell]# < /dev/urandom tr -dc a-z|head -c ${1:-10};echo
iprnfrqlhr
2.生成10个大写字母
[root@llody55 shell]# < /dev/urandom tr -dc A-Z|head -c ${1:-10};echo
PSKSFZYQPH
3.生成10个数字
[root@llody55 shell]# < /dev/urandom tr -dc 0-9|head -c ${1:-10};echo
7341384592
4.生成10个数字和大写字母的组合字符串
[root@llody55 shell]# < /dev/urandom tr -dc 0-9-A-Z|head -c ${1:-10};echo
M6HP4LHTNJ
5.生成10个随机字符（包含数字，大写字母，小写字母）
[root@llody55 shell]# < /dev/urandom tr -dc 0-9-A-Z-a-z|head -c ${1:-10};echo
79JUYcjrjx
6.生成10个随机字符（包含数字，大写字母，小写字母）
[root@llody55 shell]# < /dev/urandom tr -dc 0-9-A-Z-a-z-|head -c ${1:-10};echo
JdOi4TMmZD
7.生成10个随机字符（包含数字，大写字母，小写字母，特殊字符）
[root@llody55 shell]# < /dev/urandom tr -dc 0-9-A-Z-a-z-/|head -c ${1:-10};echo
s5-yTgMa8G
```

> 使用内嵌的/dev/urandom，并过滤掉那些日常不怎么使用的字符。这里也只输出结果的前32个字符

## openssl

```
[root@llody55 shell]# openssl rand -base64 10
6kf9CHiiRgiSVQ==
[root@llody55 shell]# openssl rand -base64 10|tr A-Z a-z
1ivhbhsrvjsfsa==
[root@llody55 shell]# openssl rand -base64 32|tr A-Z a-z|cut -c 1-10
hbxd/42tag
```

> 使用openssl的随机函数
