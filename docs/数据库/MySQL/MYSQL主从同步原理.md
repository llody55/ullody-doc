

## MYSQL主从用途

>
> 1） MYSQL主从，有主库和从库，内容一般是一致，master/slave；
>
> 2） 假设LAP（Linux+Apache+PHP）+MYSQL（单台），MYSQL属于单点故障，一旦MYSQL宕机，整合网站无法访问；
>
> 3） 为了解决单点问题，引入MYSQL从库，从而保证网站数据库不宕机或者宕机之后能够快速恢复；
>
> 4） MYSQL主从，主库和从库一定保持一致，如何保证主从数据一致？
>
> 5） MYSQL主从架构，可以协助实现数据库读写分离，从而保证网站更加的稳定和可靠；

## MYSQL主从同步原理

>
> 1） MYSQL主从同步是异步复制的过程，整个同步需要开启3线程，master上开启bin-log日志（记录数据库增、删除、修改、更新操作）；
>
> 2） Slave开启I/O线程来请求master服务器，请求指定bin-log中position点之后的内容；
>
> 3） Master端收到请求，Master端I/O线程响应请求，bin-log、position之后内容返给salve；
>
> 4） Slave将收到的内容存入relay-log中继日志中，生成master.info（记录master ip、bin-log、position、用户名密码）；
>
> 5） Slave端SQL实时监测relay-log日志有更新，解析更新的sql内容，解析成sql语句，再salve库中执行；
>
> 6） 执行完毕之后，Slave端跟master端数据保持一致！

## MYSQL bin-log用途

>
> 1） bin-log日志最大的功能记录数据库增、删、改、插入等操作，记录用户操作的SQL语句；
>
> 2） bin-log日志可以用数据增量备份、完整备份；
>
> 3） bin-log还可以主要主从复制+读写分离；
>
> 7、 MYSQL主从;
>
> 8、 MYSQL高可用;
