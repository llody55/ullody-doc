## MYSQL 最朴素的监控方式

### 简介

> 对于当前数据库的监控方式有很多，分为数据库自带、商用、开源三大类，每一种都有各自的特色；而对于 mysql 数据库由于其有很高的社区活跃度，监控方式更是多种多样，不管哪种监控方式最核心的就是监控数据，获取得到全面的监控数据后就是灵活的展示部分。那我们今天就介绍一下完全采用 mysql 自有方式采集获取监控数据，在单体下达到最快速、方便、损耗最小。
>
> 本次文章完全使用 mysql 自带的 show 命令实现获取，从 connects、buffercache、lock、SQL、statement、Database throughputs、serverconfig7 大方面全面获取监控数据。

### 连接数（Connects）

```bash
1、Threads_connected显示的数值就是当前的连接数
SHOW STATUS LIKE 'Threads%';

2、查看当前各用户连接数据库的数量
select USER , count(*) from information_schema.processlist group by USER;

3、查看连接到数据库的客户端ip及各连接数
SELECT substring_index(host, ':',1) AS host_name,state,count(*) FROM information_schema.processlist GROUP BY state,host_name;

4、查看连接到数据库的账号、客户端ip及各连接数
SELECT user,substring_index(host, ':',1) AS host_name,state,count(*) FROM information_schema.processlist GROUP BY state,host_name;

5、查看最大连接数
SHOW VARIABLES LIKE '%max_connections%';

6、当前打开的连接数
show status like 'Threads_connected';

7、如果要修改最大连接数为500
set global max_connections=500；

8、也可以修改mysql配置文件
max_connections=500

修改配置文件需要重启数据库
9、查看当前连接中连接时间最长的的连接
select host,user,time,state,info from information_schema.processlist order by time desc limit 10;

```

### 缓存（bufferCache）

```bash
# 未从缓冲池读取的次数：
show status like 'Innodb_buffer_pool_reads';

# 从缓冲池读取的次数：
show status like 'Innodb_buffer_pool_read_requests';

# 缓冲池的总页数：
show status like 'Innodb_buffer_pool_pages_total';

# 缓冲池空闲的页数：
show status like 'Innodb_buffer_pool_pages_free';

# 缓存命中率计算：
（1-Innodb_buffer_pool_reads/Innodb_buffer_pool_read_requests）*100%;

# 缓存池使用率为：
((Innodb_buffer_pool_pages_total-Innodb_buffer_pool_pages_free）/Innodb_buffer_pool_pages_total）*100%;
```

### 锁（lock）

```bash
# 查看是否存在表锁
show open TABLES where in_use>0;  

# 查看当前表进程
SHOW PROCESSLIST;  

-- MySQL5的写法
# 查询死锁表
SELECT * FROM INFORMATION_SCHEMA.INNODB_LOCKS; 

# 查询死锁等待时间
SELECT * FROM information_schema.INNODB_LOCK_waits; 

-- MySQL8的写法
# 查询当前运行事务
SELECT * FROM information_schema.INNODB_TRX; 

# 查询死锁表 
select * from performance_schema.data_locks; 

# 查询死锁等待时间
select * from performance_schema.data_lock_waits; 

# 平均每次锁等待时间
show status like 'Innodb_row_lock_time_avg'; 

# 锁等待个数
show status like 'Innodb_row_lock_waits';
 
# 处理死锁办法
1，重启mysql数据库（生产环境不推荐）
2，KILL ID （根据ID杀掉锁进程）
3,UNLOCK TABLES  (手动释放表锁)
```

> * 锁等待个数：show status like ‘Innodb_row_lock_waits’
> * 平均每次锁等待时间：show status like ‘Innodb_row_lock_time_avg’
> * 查看是否存在表锁：show open TABLES where in_use>0；有数据代表存在锁表，空为无表锁
> * 查看表情况：show processlist;  sleep表示锁未释放。
> * 表锁分析：SHOW STATUS LIKE 'table%';  Table_locks_immediate ：产生表级锁定的次数，表示可以立即获取锁的查询次数，每立即获取锁值加1。Table_locks_waited：出现表级锁定争用而发生等待的次数（不能立即获取锁的次数，每等待一次锁值加1），此值高则说明存在着较严重的表级锁争用情况。
>
> 备注：锁等待统计得数量为累加数据，每次获取得时候可以跟之前得数据进行相减，得到当前统计得数据

### SQL

```bash
# 查看 mysql 开关是否打开
show variables like 'slow_query_log';# ON 为开启状态，如果为 OFF，set global slow_query_log=1 进行开启
# 查看 mysql 阈值
show variables like 'long_query_time';# 根据页面传递阈值参数，修改阈值 set global long_query_time=0.1
# 查看 mysql 慢 sql 目录
show variables like 'slow_query_log_file';
# 格式化慢 sql 日志 -- 命令行工具
mysqldumpslow -s at -t 10 /export/data/mysql/log/slow.log

# 注：此语句通过 jdbc 执行不了，属于命令行执行。

# 意思为：显示出耗时最长的 10 个 SQL 语句执行信息，10 可以修改为 TOP 个数。显示的信息为：执行次数、平均执行时间、SQL 语句

# 备注：当 mysqldumpslow 命令执行失败时，将慢日志同步到本地进行格式化处理。

```

### statement

```bash
- insert 数量：show status like 'Com_insert';
- delete 数量：show status like 'Com_delete';
- update 数量：show status like 'Com_update';
- select 数量：show status like 'Com_select';
```

### 吞吐（Database throughputs）

```bash
- 发送吞吐量：show status like 'Bytes_sent';
- 接收吞吐量：show status like 'Bytes_received';
- 总吞吐量：Bytes_sent+Bytes_received;
```

### MySQL 当前的配置参数（serverconfig）

```bash
show variables;
```

### 慢 SQL

#### 开启慢sql

```bash
# 开启慢日志
slow_query_log=ON
slow_query_log_file=/var/lib/mysql/alvin-slow.log
long_query_time=3
log_output=FILE
```

#### 常见用法

```bash
# 取出使用最多的 10 条慢查询
mysqldumpslow -s c -t 10 /var/lib/mysql/alvin-slow.log

# 取出查询时间最慢的 3 条慢查询
mysqldumpslow -s t -t 3 /var/lib/mysql/alvin-slow.log
```

> 注意：使用 mysqldumpslow 的分析结果不会显示具体完整的 sql 语句，只会显示 sql 的组成结构；

#### 查看慢日志

```sql
SELECT 
    start_time AS '开始时间', 
    query_time AS '查询时间（秒）', 
    lock_time AS '锁定时间（秒）', 
    rows_sent AS '发送的行数', 
    sql_text AS 'SQL语句' 
FROM 
    mysql.slow_log 
ORDER BY 
    start_time DESC 
LIMIT 10;

```

### 数据库相关SQL

#### 查看数据大小

```sql
SELECT
	table_schema AS '数据库',
	sum( table_rows ) AS '记录数',
        COUNT(*) AS '表数量',
	sum(
	TRUNCATE ( data_length / 1024 / 1024, 2 )) AS '数据容量(MB)',
	sum(
	TRUNCATE ( index_length / 1024 / 1024, 2 )) AS '索引容量(MB)' 
FROM
	information_schema.TABLES 
GROUP BY
	table_schema 
ORDER BY
	sum( data_length ) DESC,
	sum( index_length ) DESC;
```

> 查看所有数据库的大小，索引等信息。

#### 查看当前正在运行的查询

```sql
SELECT 
    id AS '连接ID', 
    user AS '用户', 
    host AS '主机', 
    db AS '数据库', 
    command AS '命令', 
    time AS '执行时间（秒）', 
    state AS '状态', 
    info AS '查询' 
FROM 
    information_schema.PROCESSLIST 
ORDER BY 
    time DESC;

```

#### 查看表的存储引擎和行格式

```sql
SELECT
    table_schema AS '数据库',
    table_name AS '表名',
    engine AS '存储引擎',
    row_format AS '行格式',
    table_rows AS '记录数',
    data_length AS '数据大小',
    index_length AS '索引大小'
FROM
    information_schema.TABLES
WHERE 
    table_schema NOT IN ('information_schema', 'performance_schema', 'mysql', 'sys')
ORDER BY 
    data_length DESC;

```

#### 查看用户权限

```sql
--  查看数据库账户信息
SELECT 
    user AS '用户', 
    host AS '主机', 
    authentication_string AS '认证方式', 
    password_last_changed AS '密码最后修改时间',
    account_locked AS '账号锁定状态'
FROM 
    mysql.user;

-- 查看账户详细权限
SELECT 
    GRANTEE AS '用户',
    PRIVILEGE_TYPE AS '权限类型',
    IS_GRANTABLE AS '是否可授予'
FROM 
    information_schema.USER_PRIVILEGES;

-- 获取指定用户权限详细如：root
SHOW GRANTS FOR 'root'@'%';

```

#### 查看数据库的事务状态

```sql
-- 活动的事务
SELECT 
    trx_id AS '事务ID',
    trx_state AS '事务状态',
    trx_started AS '事务开始时间',
    trx_requested_lock_id AS '请求锁ID',
    trx_wait_started AS '等待开始时间',
    trx_weight AS '事务权重',
    trx_mysql_thread_id AS 'MySQL线程ID',
    trx_query AS '事务查询'
FROM 
    information_schema.INNODB_TRX
ORDER BY 
    trx_started DESC;

-- 锁定的事务
SELECT 
    t.trx_id AS '事务ID',
    t.trx_state AS '事务状态',
    t.trx_started AS '事务开始时间',
    t.trx_mysql_thread_id AS '线程ID',
    l.LOCK_MODE AS '锁模式',
    l.LOCK_TYPE AS '锁类型',
    l.OBJECT_SCHEMA AS '锁定的数据库',
    l.OBJECT_NAME AS '锁定的表',
    l.INDEX_NAME AS '锁定的索引',
    l.LOCK_STATUS AS '锁状态'
FROM 
    information_schema.INNODB_TRX t
JOIN 
    performance_schema.data_locks l ON t.trx_mysql_thread_id = l.ENGINE_TRANSACTION_ID
ORDER BY 
    t.trx_started DESC;

```

#### 查看表的碎片情况

```bash
SELECT 
    table_schema AS '数据库', 
    table_name AS '表名', 
    ROUND(data_length / 1024 / 1024, 2) AS '数据大小(MB)', 
    ROUND(index_length / 1024 / 1024, 2) AS '索引大小(MB)', 
    ROUND((data_length + index_length) / 1024 / 1024, 2) AS '总大小(MB)', 
    ROUND(data_free / 1024 / 1024, 2) AS '可回收空间(MB)' 
FROM 
    information_schema.TABLES 
WHERE 
    data_free > 0 
ORDER BY 
    data_free DESC;

```

#### 查看数据库的锁情况

```sql
SELECT 
    trx_id AS '事务ID',
    trx_state AS '事务状态',
    trx_started AS '事务开始时间',
    trx_requested_lock_id AS '请求锁ID',
    trx_wait_started AS '等待开始时间',
    trx_weight AS '事务权重',
    trx_mysql_thread_id AS 'MySQL线程ID'
FROM 
    information_schema.INNODB_TRX
ORDER BY 
    trx_started DESC;

```

> 确保启用了 `performance_schema：SHOW VARIABLES LIKE 'performance_schema';`
