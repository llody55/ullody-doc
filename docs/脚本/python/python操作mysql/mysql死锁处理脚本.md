## MySql死锁自动处理服务

> [!NOTE]
>
> 有时候服务经常出现死锁。
>
> 手动kill处理麻烦。
>
> 创建一个服务检查mysql死锁情况，自动进行处理。
>
> PS(注意，这是实验性质的)

### 创建 -- py-mysql-locked-kill.py

```python
#!/usr/bin/env python3
#-*- coding:utf-8 -*-
'''
Author: 745719408@qq.com 745719408@qq.com
Date: 2023-02-21 10:21:21
LastEditors: 745719408@qq.com 745719408@qq.com
LastEditTime: 2023-02-22 10:54:04
FilePath: \K8S\组件包\py脚本\python操作应用\py-mysql-locked-ops.py
Description: 主要用于监听数据库死锁，并强制解开死锁的脚本。
'''

import os,sys
import time
from pymysql import *
import logging
import logging.config

#加载日志配置文件
logging.config.fileConfig('/app/logging.conf')
logger = logging.getLogger()

#设置接收变量
host= os.environ.get('HOST','127.0.0.1') # 192.168.1.220
port=os.environ.get('PORT',3306)  # 33066
username=os.environ.get('USERNAME','root') # root
password = os.environ.get('PASSWORD','None') 

#默认间隔时间
timeload=os.environ.get('TIMES',30)

#强制转换变量端口号为int类型
ports = int(port)
#强制转换传入变量时间为int类型
timesr=int(timeload)

#倒计时方法
def time_ops():
    for i in range(timesr,0,-1):
        print("在%2s秒后再执行" % i ,end='\r')
        time.sleep(1)
    print("在%2s秒后再执行" % 0)

#连接数据库主方法
def locked_ops():
    try:
        conn = connect(
            host=host,
            port=ports,
            user=username,
            password=password,
            charset="utf8",
            autocommit=True
        )
        cursor = conn.cursor()
        sql="SELECT trx_mysql_thread_id from information_schema.INNODB_TRX"
        cursor.execute(sql)
        row = cursor.fetchall()
        if len(row) > 0:
            for item in row:
                logger.warning("存在死锁")
                cursor.execute('kill %s' % item[0])
                logger.info('删除死锁成功 %s' % item[0])
                logger.info('删除死锁成功，等待下次执行')
        else:
            logger.info('不存在死锁，等待下次执行')
        cursor.close()
        #time_ops()
        time.sleep(timesr)
  
    except Exception as e:
        logger.error("执行出错",e)
        sys.exit(-1)
      

if __name__ == '__main__':
    while True:
        locked_ops()
```

### 创建 -- logging.conf

```
[loggers]
keys=root

[handlers]
keys=consoleHandler

[formatters]
keys=simpleFormatter

[logger_root]
level=DEBUG
handlers=consoleHandler


[handler_consoleHandler]
class=StreamHandler
level=DEBUG
formatter=simpleFormatter
args=(sys.stdout,)

[formatter_simpleFormatter]
format=%(asctime)s - %(name)s - %(levelname)s - %(message)s
```

### 创建 -- Dockerfile

```Dockerfile
FROM  python:3.10.9-slim-buster
LABEL maintainer llody
COPY . /app
WORKDIR /app
RUN pip3 install -r requirements.txt -i https://pypi.douban.com/simple/ --no-cache-dir
CMD ["python3","py-mysql-locked-kill.py"]
```

### 构建镜像

```bash
#示例
docker build -t llody/locked-kill:v2 .
```

### 运行容器

```bash
#示例
docker run -e HOST='192.168.1.216'  -e USERNAME='root' -e PASSWORD="" -e TIMES=5  --rm  llody/locked-kill:v2 

#部分变量解释
HOST   mysql数据库IP地址,默认值：127.0.0.1
PORT   mysql数据库端口,默认值：3306
USERNAME  mysql账户,默认值：root
PASSWORD  mysql密码，默认值：none
TIMES    间隔检查时间，默认值：30秒

#权限
账户需具备查询：information_schema 库的权限

#作用
查询到死锁ID，会直接进行KILL操作，释放锁。
```

> [!WARNING]
>
> 再次提醒，确认可以操作。
