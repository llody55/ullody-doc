## centos7

### 基于RSA加密协议生成密钥

```bash
ssh-keygen -t rsa
```

### 本机公钥拷贝至远程主机

```bash
ssh-copy-id  root@192.168.199.124
```

> 默认是：.ssh/id_rsa.pub 文件
>
> -i 指定文件

### 登录验证

```bash
ssh root@192.168.199.124
```
