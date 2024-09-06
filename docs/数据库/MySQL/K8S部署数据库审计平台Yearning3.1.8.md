# K8S部署Yearning3.1.8

## 系统简介

| 系统               | K8S版本 | CPU架构 | CPU         | Yearning |
| ------------------ | ------- | ------- | ----------- | -------- |
| Ubuntu 22.04.4 LTS | v1.24.9 | ARM64   | Kunpeng-920 | 3.1.8    |

## 创建命名空间

```bash
root@k8s-master1:~# kubectl create namespace yearning
namespace/yearning created
```

## 部署mysql8

```bash
vim yearning-mysql.yaml
```

```yaml
---
apiVersion: v1
kind: ConfigMap
metadata:
  labels:
    app.kubernetes.io/instance: mysql
    app.kubernetes.io/managed-by: llody
    app.kubernetes.io/name: db
    app.kubernetes.io/version: 1.24.9
  name: yearning-mysql-config
  namespace: yearning
data:
  my.cnf: |-
    [client]
    default-character-set=utf8mb4
    [mysql]
    default-character-set=utf8mb4
    [mysqld]
    max_connections = 2000
    secure_file_priv=/var/lib/mysql
    sql_mode=STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION
    group_concat_max_len = 102400
    default-time-zone = '+08:00'

---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  labels:
    app.kubernetes.io/instance: mysql
    app.kubernetes.io/managed-by: llody
    app.kubernetes.io/name: db
    app.kubernetes.io/version: 1.24.9
  name: yearning-mysql
  namespace: yearning
spec:
  podManagementPolicy: OrderedReady
  replicas: 1
  revisionHistoryLimit: 10
  selector:
    matchLabels:
      app.kubernetes.io/instance: mysql
      app.kubernetes.io/name: db
  serviceName: yearning-mysql
  template:
    metadata:
      labels:
        app.kubernetes.io/instance: mysql
        app.kubernetes.io/name: db
    spec:
      containers:
        - image: swr.cn-southwest-2.myhuaweicloud.com/llody/mysql-server:8.0.32
          args:
            - --character-set-server=utf8mb4
            - --collation-server=utf8mb4_general_ci
          imagePullPolicy: IfNotPresent
          name: mysql
          ports:
            - containerPort: 3306
              name: mysql
              protocol: TCP
          env:
            - name: TZ
              value: Asia/Shanghai
            - name: MYSQL_DATABASE
              value: 'yearning'
            - name: MYSQL_USER
              value: 'yearning'
            - name: MYSQL_ROOT_PASSWORD
              value: '7f6e8ec71ccfca9d494'
            - name: MYSQL_PASSWORD
              value: '7f6e8ec71ccfca9d494'
          resources:
            limits:
              cpu: '1'
              memory: 4Gi
            requests:
              cpu: '200m'
              memory: 1048Mi
          securityContext:
            runAsUser: 999
          terminationMessagePath: /dev/termination-log
          terminationMessagePolicy: File
          volumeMounts:
            - mountPath: /etc/mysql/conf.d/my.cnf
              name: conf
              subPath: my.cnf
            - name: yearning-mysql-pvc
              mountPath: /var/lib/mysql
      dnsPolicy: ClusterFirst
      restartPolicy: Always
      schedulerName: default-scheduler
      securityContext: {}
      terminationGracePeriodSeconds: 1800
      volumes:
        - configMap:
            defaultMode: 420
            name: yearning-mysql-config
          name: conf
        - name: yearning-mysql-pvc
          persistentVolumeClaim:
            claimName: yearning-mysql-pvc
  updateStrategy:
    rollingUpdate:
      partition: 0
    type: RollingUpdate
---
apiVersion: v1
kind: Service
metadata:
  labels:
    app.kubernetes.io/instance: mysql
    app.kubernetes.io/managed-by: llody
    app.kubernetes.io/name: db
    app.kubernetes.io/version: 1.24.9
  name: yearning-mysql-svc
  namespace: yearning
spec:
  selector:
    app.kubernetes.io/instance: mysql
    app.kubernetes.io/name: db
  ports:
    - protocol: TCP
      port: 3306
      targetPort: 3306
      nodePort: 30011
  type: NodePort

---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  # pvc名称
  name: yearning-mysql-pvc
  namespace: yearning
spec:
  # 读写权限
  accessModes:
    - ReadWriteOnce
  # 使用的存储类
  storageClassName: managed-nfs-storage
  # 定义容量
  resources:
    requests:
      storage: 10Gi
```

> 自行准备NFS存储。或者参考我**[ubantu22.04部署NFS](https://doc.llody.top/?#/存储/NFS/ubantu22.04部署NFS "ubantu22.04部署NFS")**创建。

## 初始化项目

### 启动容器

```bash
root@k8s-master1:~/yearning# kubectl run yearning-init -it -n yearning  --rm --image=swr.cn-southwest-2.myhuaweicloud.com/llody/yearning:v3.1.8 -- /bin/bash
If you don't see a command prompt, try pressing enter.
yearning-init:/opt# ls
Yearning   conf.toml
```

### 设置环境变量

```bash
yearning-init:/opt# export MYSQL_ADDR=10.233.83.153
yearning-init:/opt# export MYSQL_USER=yearning
yearning-init:/opt# export MYSQL_PASSWORD=7f6e8ec71ccfca9d494
yearning-init:/opt# export MYSQL_DB=yearning
yearning-init:/opt# export SECRET_KEY=A1B2C3D4E5F6G7H8
```

> 根据你当前环境设置。

### 启动初始化

```bash
yearning-init:/opt# ./Yearning install
是否已将数据库字符集设置为UTF8/UTF8MB4? [yes|no]: yes

2024/09/05 15:12:43 Yearning-go/src/service/migrate.go:147
[11.863ms] [rows:1] INSERT INTO `core_accounts` (`username`,`password`,`department`,`real_name`,`email`,`is_recorder`,`query_password`,`secret_key`) VALUES ('admin','pbkdf2_sha256$120000$rxl7yMUHzXJr$PKaTAsfcX6v89/cLQFO3/8EK+OY0rhUvJU2QFCu7GBk=','DBA','超级管理员','',2,'','')

2024/09/05 15:12:43 Yearning-go/src/service/migrate.go:155
[6.752ms] [rows:1] INSERT INTO `core_global_configurations` (`authorization`,`ldap`,`message`,`other`,`stmt`,`audit_role`,`board`,`ai`) VALUES ('global','{"url":"","user":"","password":"","type":"(\u0026(objectClass=organizationalPerson)(sAMAccountName=%s))","sc":"","ldaps":false,"map":"","test_user":"","test_password":""}','{"web_hook":"","host":"","port":25,"user":"","password":"","to_user":"","mail":false,"ding":false,"ssl":false,"push_type":false,"key":"","format":""}','{"limit":1000,"idc":["Aliyun","AWS"],"query":false,"register":false,"export":false,"ex_query_time":60,"domain":""}',0,'{"DMLTransaction":false,"DMLAllowLimitSTMT":false,"DMLInsertColumns":false,"DMLMaxInsertRows":10,"DMLWhere":false,"DMLOrder":false,"DMLSelect":false,"DMLAllowInsertNull":false,"DMLInsertMustExplicitly":false,"DDLEnablePrimaryKey":false,"DDLCheckTableComment":false,"DDlCheckColumnComment":false,"DDLCheckColumnNullable":false,"DDLCheckColumnDefault":false,"DDLEnableAcrossDBRename":false,"DDLEnableAutoincrementInit":false,"DDLEnableAutoIncrement":false,"DDLEnableAutoincrementUnsigned":false,"DDLEnableDropTable":false,"DDLEnableDropDatabase":false,"DDLEnableNullIndexName":false,"DDLIndexNameSpec":false,"DDLMaxKeyParts":5,"DDLMaxKey":5,"DDLMaxCharLength":10,"MaxTableNameLen":10,"MaxAffectRows":1000,"MaxDDLAffectRows":0,"SupportCharset":"","SupportCollation":"","CheckIdentifier":false,"MustHaveColumns":"","DDLMultiToCommit":false,"DDLPrimaryKeyMust":false,"DDLAllowColumnType":false,"DDLImplicitTypeConversion":false,"DDLAllowPRINotInt":false,"DDLAllowMultiAlter":false,"DDLEnableForeignKey":false,"DDLTablePrefix":"","DDLColumnsMustHaveIndex":"","DDLAllowChangeColumnPosition":false,"DDLCheckFloatDouble":false,"IsOSC":false,"OSCExpr":"","OscSize":0,"AllowCreateView":false,"AllowCrateViewWithSelectStar":false,"AllowCreatePartition":false,"AllowSpecialType":false,"PRIRollBack":false}','','{"base_url":"https://api.openai.com","api_key":"","frequency_penalty":0,"max_tokens":2500,"presence_penalty":0,"temperature":0,"top_p":0,"model":"gpt-3-turbo","advisor_prompt":"\nSQL Optimization expert assistant \n \nWelcome to SQL Optimization Expert Assistant! Whether you''re a database administrator, data analyst, or software developer, we''ll walk you through a series of questions and recommendations to help you optimize your SQL queries for greater efficiency and performance. Please answer the following questions or implement relevant recommendations based on your specific situation. \n \nQuery analysis \n \nDescribe the SQL query you want to optimize. Provide key parts of the query, such as SELECT, FROM, and WHERE clauses. \nHave you used EXPLAIN (or an equivalent tool) to analyze the query execution plan? If so, briefly describe the key points of the execution plan, such as scan type, join order, and so on. \n \nIndex optimization \n \nPlease list the existing indexes of all the tables involved in your query. Have you considered adding indexes to key columns in your query to improve performance? \nIf you already have indexes, is the query making good use of them? Consider using forced indexing (if the database supports it) to test different indexing strategies. \n \nQuery structure \n \nDoes your query use subqueries, Ctes (common expressions), temporary tables, or views? Consider whether it is possible to improve performance by refactoring queries, such as converting subqueries into joins. \nExamine whether it is possible to optimize queries by merging them, eliminating redundant JOIN operations, or using a more efficient aggregation strategy. \n \nAdvanced optimization strategy \n \nHave you considered partitioning tables to optimize queries on large data sets? \nFor very complex or data-heavy queries, have you considered using materialized views or precomputed summary tables to improve performance? \nReview the SQL statements provided below based on the above questions and suggestions, and try the optimization strategy accordingly. If you encounter specific problems or need further guidance during the optimization process, please provide details and we will provide more specific recommendations based on your situation. \n \nRelated table structure: \n \n{{tables_info}} \n \nSQL: \n \n{{sql}} \n \nReply Language: {{lang}}\n\n","sql_gen_prompt":"\nSQL statement generation assistant \n \nNow you will play the role of a professional DBA and generate the corresponding MYSQL SQL statement from the user''s description. \n \nTable structure: {{tables_info}}\n\nSQL: {{sql}}\n\nUse the markdown format\n\nReply Language: {{lang}}\n\n","sql_agent_prompt":"\n\n # Role: MySQL language teaching specialist \n \n## Profile: \n \n- Language: {{lang}} \n- Description: As an expert in MySQL language teaching with rich experience in MySQL teaching, you are able to teach MySQL knowledge in a fascinating way, patiently answer students'' various questions in a detailed and comprehensive way, remind students of mistakes or confusion in the process of learning MySQL statements, and explain your knowledge through example codes and detailed comments. Help students review MySQL exam, learn MySQL language, develop good MySQL language programming habits, and cultivate excellent MySQL language programming ability. \n \n### Skill: \n \n1. Rich experience in MySQL teaching \n2. Engaging teaching methods \n3. Patient, detailed and comprehensive answer ability \n4. Remind students of mistakes or confusion \n5. Illustrate knowledge through example codes and detailed comments \n \n## Goals: \n \n1. Guide students to master the basic knowledge of MySQL \n2. Help students understand complex MySQL concepts \n3. Provide detailed code examples and comments \n4. Remind students of common mistakes and confusion \n5. Help students study for the MySQL exam \n \n## Constrains: \n \n1. Teaching in {{lang}} \n2. Provide detailed code examples and comments \n3. Answer students'' questions patiently \n4. Remind students of common mistakes and confusion \n5. Help students develop good MySQL programming habits \n \n## OutputFormat: \n \n1. Output in {{lang}} \n2. Provide detailed code examples and comments \n3. Answer students'' questions patiently \n4. Remind students of common mistakes and confusion \n5. Help students develop good MySQL programming habits \n \n## Workflow: \n \n1. Analyze students'' problems and needs \n2. According to \\[CRISPE prompt frame], determine the most suitable role to play \n3. Build a good Prompt that conforms to \\[CRISPE prompt framework] \n4. Provide detailed code examples and comments \n5. Remind students of common mistakes and confusion \n \n## Initialization: \n \nAs a MySQL language teaching specialist, you must follow the above rules and communicate with users in {{lang}}, the default language.\n","proxy_url":""}')

2024/09/05 15:12:43 Yearning-go/src/service/migrate.go:163
[5.982ms] [rows:1] INSERT INTO `core_graineds` (`username`,`group`) VALUES ('admin','["16e14a55-ee79-4c54-90bd-3f4abed3ea0d"]')

2024/09/05 15:12:43 Yearning-go/src/service/migrate.go:167
[5.039ms] [rows:1] INSERT INTO `core_role_groups` (`name`,`permissions`,`group_id`) VALUES ('admin','{"ddl_source":[],"dml_source":[],"query_source":[]}','16e14a55-ee79-4c54-90bd-3f4abed3ea0d')
Initialization successful! Username: admin Password: Yearning_admin Please run ./Yearning run, default address: http://<host>:8000
yearning-init:/opt# exit
exit
Session ended, resume using 'kubectl attach yearning-init -c yearning-init -i -t' command when the pod is running
pod "yearning-init" deleted
```

## 部署Yearning

```bash
vim  yearning-deployment.yaml
```

```yaml
---
apiVersion: v1
kind: Secret
metadata:
  name: db-conf
  namespace: yearning
type: Opaque  # 使用的是generic类型
data:   # 这里配置的是数据库的相关信息，使用base64加密输入：
  addr: eWVhcm5pbmctbXlzcWwtc3ZjLnllYXJuaW5nLnN2Yy5jbHVzdGVyLmxvY2Fs    # echo -n 'yearning-mysql-svc.yearning.svc.cluster.local' | base64         
  user: eWVhcm5pbmc=                                                    # echo -n 'yearning' | base64
  pass: N2Y2ZThlYzcxY2NmY2E5ZDQ5NA==                                    # echo -n '7f6e8ec71ccfca9d494' | base64
  data: eWVhcm5pbmc=                                                    # echo -n 'yearning' | base64
  sk: QTFCMkMzRDRFNUY2RzdIOA==                                          # echo -n 'A1B2C3D4E5F6G7H8' | base64
  lang: emhfQ04=                                                        # echo -n 'zh_CN' | base64

---
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app.kubernetes.io/instance: yearning
    app.kubernetes.io/managed-by: llody
    app.kubernetes.io/name: node-front
    app.kubernetes.io/version: 1.24.9
  name: yearning
  namespace: yearning
spec: 
  progressDeadlineSeconds: 600
  replicas: 1
  revisionHistoryLimit: 10
  selector:
    matchLabels:
      app.kubernetes.io/instance: yearning
      app.kubernetes.io/name: node-front
  template:
    metadata:
      labels:
        app.kubernetes.io/instance: yearning
        app.kubernetes.io/name: node-front
    spec:
      containers:
        - image: swr.cn-southwest-2.myhuaweicloud.com/llody/yearning:v3.1.8
          command: ["/bin/bash", "-c", "./Yearning run"]
          name: yearning
          imagePullPolicy: IfNotPresent
          env:
            - name: MYSQL_ADDR
              valueFrom:
                secretKeyRef:
                  name: db-conf
                  key: addr
            - name: MYSQL_USER
              valueFrom:
                secretKeyRef:
                  name: db-conf
                  key: user
            - name: MYSQL_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: db-conf
                  key: pass
            - name: MYSQL_DB
              valueFrom:
                secretKeyRef:
                  name: db-conf
                  key: data
            - name: SECRET_KEY
              valueFrom:
                secretKeyRef:
                  name: db-conf
                  key: sk
            - name: Y_LANG
              valueFrom:
                secretKeyRef:
                  name: db-conf
                  key: lang
          ports:
            - containerPort: 8000
              name: web
              protocol: TCP
          readinessProbe:
            httpGet:
              path: /
              port: web
              scheme: HTTP
            initialDelaySeconds: 25
            periodSeconds: 2
          livenessProbe:
            httpGet:
              path: /
              port: web
              scheme: HTTP
            initialDelaySeconds: 30
            periodSeconds: 2
          resources:
            requests:
              cpu: 200m
              memory: 1Gi
            limits:
              cpu: 250m
              memory: 2Gi
      dnsPolicy: ClusterFirst
      restartPolicy: Always
      schedulerName: default-scheduler
      securityContext:
        fsGroup: 101
      serviceAccount: default
      serviceAccountName: default
      terminationGracePeriodSeconds: 30

---
apiVersion: v1
kind: Service
metadata:
  labels:
    app.kubernetes.io/instance: yearning
    app.kubernetes.io/managed-by: llody
    app.kubernetes.io/name: node-front
    app.kubernetes.io/version: 1.24.9
  name: yearning
  namespace: yearning
spec:
  ports:
    - port: 80
      protocol: TCP
      targetPort: 8000
      nodePort: 30010
  selector:
    app.kubernetes.io/instance: yearning
    app.kubernetes.io/name: node-front
  type: NodePort

```

## 验证访问

### 输出

```bash
root@k8s-master1:~/yearning# kubectl logs -n yearning yearning-7bff696dc-bstbx -f
检查更新...
数据已更新!

    __  __    
    _ \/ /_________ 
    __  /_  _ \  _ \
    _  / /  __/  __/
    /_/  \___/\___/   yee v0.5.1
-----Easier and Faster-----
Creator: Henry Yee
```

> 默认账号：admin，默认密码：Yearning_admin
>
> 相关文档地址：https://next.yearning.io/guide/config/user.html

### 访问

> http://192.168.1.212:30010/
>
