## 原库

### 整库导出原库

```bash
[root@wc-ctu-30 ]# mkdir tmp && cd tmp
[root@wc-ctu-30 tmp]# mysqldump --single-transaction --column-statistics=0 -u app -p --databases auth app logs | gzip > app.sql.gz
Enter password: 

```

> --databases 后面可以跟多个数据库。

## 新库

### 同步文件到新库

```bash
root@mysql:~# rsync -avzP root@192.168.148.18:/root/tmp/ /root/app/
The authenticity of host '192.168.148.18 (192.168.148.18)' can't be established.
ED25519 key fingerprint is SHA256:eYGkOReFPcCQ492wReMDFcCI6vcpt1vDHg+X7adMjdI.
This key is not known by any other names
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added '192.168.148.18' (ED25519) to the list of known hosts.
root@192.168.148.18's password: 
receiving incremental file list
./
app.sql.gz
      9,282,465 100%   21.91MB/s    0:00:00 (xfr#1, to-chk=0/2)

sent 46 bytes  received 9,257,311 bytes  393,930.09 bytes/sec
total size is 9,282,465  speedup is 1.00

```

### 整库导入新数据库

```bash
root@mysql:~# gunzip -f < app/app.sql.gz | mysql -u app -p
Enter password: 

```
