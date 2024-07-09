## **MyFlash**简介

> MyFlash是由美团点评公司技术工程部开发维护的一个回滚DML操作的工具。该工具通过解析v4版本的binlog，完成回滚操作。相对已有的回滚工具，其增加了更多的过滤选项，让回滚更加容易。 **该工具已经在美团点评内部使用**

## **MyFlash**项目地址

```bash
https://github.com/Meituan-Dianping/MyFlash
```

## **MyFlash安装**

```bash
# 下载压缩文件
https://codeload.github.com/Meituan-Dianping/MyFlash/zip/refs/heads/master

# 解压
unzip MyFlash-master.zip
# 进入目录
cd MyFlash-master
# 安装依赖
yum install glib2-devel -y
# 构建
gcc -w `pkg-config --cflags --libs glib-2.0` source/binlogParseGlib.c -o binary/flashback
```

## **前置条件**

> 开启binlog，binlog格式必须为ROW，且binlog_row_image必须为full。
>
> 适用于MySQL5.6、5.7，MySQL8.0测试也可以正常使用。

## **参数说明**

```bash
 ~/MyFlash-master  root@192.168.1.236 udockerpanenl 15:06:11 
# cd binary/

 ~/MyFlash-master/binary  root@192.168.1.236 udockerpanenl 15:07:45 
# ./flashback --help
Usage:
  flashback [OPTION?]

Help Options:
  -h, --help                  Show help options

Application Options:
  --databaseNames             databaseName to apply. if multiple, seperate by comma(,)
  --tableNames                tableName to apply. if multiple, seperate by comma(,)
  --tableNames-file           tableName to apply. if multiple, seperate by comma(,)
  --start-position            start position
  --stop-position             stop position
  --start-datetime            start time (format %Y-%m-%d %H:%M:%S)
  --stop-datetime             stop time (format %Y-%m-%d %H:%M:%S)
  --sqlTypes                  sql type to filter . support INSERT, UPDATE ,DELETE. if multiple, seperate by comma(,)
  --maxSplitSize              max file size after split, the uint is M
  --binlogFileNames           binlog files to process. if multiple, seperate by comma(,)  
  --outBinlogFileNameBase     output binlog file name base
  --logLevel                  log level, available option is debug,warning,error
  --include-gtids             gtids to process. if multiple, seperate by comma(,)
  --include-gtids-file        gtids to process. if multiple, seperate by comma(,)
  --exclude-gtids             gtids to skip. if multiple, seperate by comma(,)
  --exclude-gtids-file        gtids to skip. if multiple, seperate by comma(,)


```

> **参数使用说明：**
>
> * **databaseNames**
>
>   指定需要回滚的数据库名。多个数据库可以用“,”隔开。如果不指定该参数，相当于指定了所有数据库。
> * **tableNames**
>
>   指定需要回滚的表名。多个表可以用“,”隔开。如果不指定该参数，相当于指定了所有表。
> * **start-position**
>
>   指定回滚开始的位置。如不指定，从文件的开始处回滚。请指定正确的有效的位置，否则无法回滚。
> * **stop-position**
>
>   指定回滚结束的位置。如不指定，回滚到文件结尾。请指定正确的有效的位置，否则无法回滚。
> * **start-datetime**
>
>   指定回滚的开始时间。注意格式必须是 %Y-%m-%d %H:%M:%S。如不指定，则不限定时间。
> * **stop-datetime**
>
>   指定回滚的结束时间。注意格式必须是 %Y-%m-%d %H:%M:%S。如不指定，则不限定时间。
> * **sqlTypes**
>
>   指定需回滚的sql类型。目前支持的过滤类型是INSERT, UPDATE ,DELETE。多个类型可以用“,”隔开。
> * **maxSplitSize**
>
>   一旦指定该参数，对文件进行固定尺寸的分割（单位为M），过滤条件有效，但不进行回滚操作。该参数主要用来将大的binlog文件切割，防止单次应用的binlog尺寸过大，对线上造成压力。
> * **binlogFileNames**
>
>   指定需要回滚的binlog文件，目前只支持单个文件，后续会增加多个文件支持。经测试已支持多个binlog文件。
> * **outBinlogFileNameBase**
>
>   指定输出的binlog文件前缀，如不指定，则默认为binlog_output_base.flashback。
> * **logLevel**
>
>   仅供开发者使用，默认级别为error级别。在生产环境中不要修改这个级别，否则输出过多。
> * **include-gtids**
>
>   指定需要回滚的gtid,支持gtid的单个和范围两种形式。
> * **exclude-gtids**
>
>   指定不需要回滚的gtid，用法同include-gtids。

## **测试使用**

> 数据库版本：8.0.32

### 创建测试数据库和数据

```sql
-- 创建数据库
CREATE DATABASE demo;

-- 使用创建的数据库

USE demo;
-- 创建 test 表
CREATE TABLE user_test (
    id INT PRIMARY KEY,
    name VARCHAR(50)
);

-- 插入数据
INSERT INTO user_test (id, name) VALUES (1, 'zhangsan');
INSERT INTO user_test (id, name) VALUES (2, 'lisi');
INSERT INTO user_test (id, name) VALUES (3, 'wangwu');
INSERT INTO user_test (id, name) VALUES (4, 'llody');

-- 查询数据
SELECT * FROM user_test;
```

### 刷新日志

```sql
-- 刷新日志文件，包括binlog
flush logs; 
```

### 测试删除数据

```sql
-- 测试删除ID等于4的数据
DELETE FROM user_test WHERE id=4;

SELECT * FROM user_test;
```

### 遇到权限问题

```sql
GRANT SYSTEM_VARIABLES_ADMIN ON *.* TO 'root'@'%';

SHOW GRANTS FOR 'root'@'%';
```

### 进行恢复

```bash
# 输出指定时间的操作到文件
root@mysql8 ~/binary]#./flashback --databaseNames=demo --tableNames=user_test --start-datetime='2024-07-05 15:50:00' --stop-datetime='2024-07-05 15:54:00' --binlogFileNames=/data/mysqldata/mysql-bin.000098  --outBinlogFileNameBase=user_testback

# 输出user_testback.flashback进行恢复的文件
[root@mysql8 ~/binary]#ls
flashback  mysqlbinlog20160408  user_testback.flashback

# 使用mysqlbinlog进行解析并恢复到数据库中。
[root@mysql8 ~/binary]#./mysqlbinlog20160408 -vv --skip-gtids user_testback.flashback |mysql -uroot -p'lgkj_2022Hunan' -S /var/lib/mysql/mysql.sock
mysql: [Warning] Using a password on the command line interface can be insecure.
```

#### **同类型工具对比**

> **这里主要是对比binlog2sql：**
>
> * MyFlash工具需要结合mysqlbinlog解析确认需要恢复数据的精确位点，而binlog2sql可以解析为sql语句，更方便确认所需的回滚数据，方便易用。
> * binlog2sql可以生成回滚sql和未回滚sql，MyFlash只能生成回滚binlog，未回滚binlog结合mysqlbinlog解析生成。
> * binlog2sql需要python安装环境，自测mysql8使用过程中因为回滚数据不同，可能出现字符集相关的问题，MyFlash运行比较稳定。
> * 小数据量可以使用binlog2sql进行恢复，大量数据建议使用MyFlash，官方测试100万数据，MyFlash恢复用2.7秒，binlog2sql用581.3秒。
>
