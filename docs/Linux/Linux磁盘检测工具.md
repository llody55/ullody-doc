# **HDsentinel介绍**

> HDsentinel 是一款硬盘健康度检测工具，可以检测你电脑中磁盘的健康度检测，低于100%就要小心了，可能有损坏的风险，应及时更换。
>
> 同时支持，Windows和Linux。

## 主要功能

> * 监控硬盘状态，运行状况、温度和S.M.A.R.T信息。
> * 支持查看Windows磁盘卷和磁盘阵列信息，磁盘性能。
> * 多种磁盘测试模式，如磁盘传输速度，基准测试，随意搜寻测试、表面测试等。
> * 丰富的报告类型格式，包含txt、html、xml等格式，最真实的硬盘报告。
> * 同时支持哨兵监控模式。

## 下载

### Linux

```bash
wget https://www.hdsentinel.com/hdslin/hdsentinel-020b-x64.zip
```

### windows

```bash
https://www.harddisksentinel.com/hdsentinel_setup.zip
```

## 安装

### Linux

```bash
[root@node001 ~]# unzip hdsentinel-020b-x64.zip                                                                                               
Archive:  hdsentinel-020b-x64.zip
  inflating: HDSentinel  
[root@node001 ~]# chmod +x HDSentinel 
```

## windows

> 解压双击运行即可。

## 检测

```bash
# 默认扫描所有
[root@node001 ~]# ./HDSentinel 
Hard Disk Sentinel for LINUX console 0.20b-x64.10851 (c) 2023 info@hdsentinel.com
Start with -r [reportfile] to save data to report, -h for help

Examining hard disk configuration ...

HDD Device  0: /dev/sda   
HDD Model ID : SEAGATE ST600MM0006
HDD Serial No: S0M382YS
HDD Revision : 0004
HDD Size     : 1143551 MB
Interface    : LSI  RAID #0/0 [8-0] SAS
Temperature  : 47 °C
Highest Temp.: 47 °C
Health       : 94 %
Performance  : 100 %
Power on time: 1153 days, 22 hours, 26 minutes
Est. lifetime: 592 days
Total written: 8.77 TB
  The hard disk reports the following problems:
  Total uncorrected verify errors = 6
    No actions needed.
```

```bash
# 扫描指定盘
[root@node001 ~]# ./HDSentinel -onlydevs /dev/sda 
Hard Disk Sentinel for LINUX console 0.20b-x64.10851 (c) 2023 info@hdsentinel.com
Start with -r [reportfile] to save data to report, -h for help

Examining hard disk configuration ...

HDD Device  0: /dev/sda       
HDD Model ID : HGST    HUC101212CSS600
HDD Serial No: L0J1YJZJ  
HDD Revision : U5E0
HDD Size     : 8008447 MB
Interface    : LSI  RAID #0/0 [8-0] SAS
Temperature  : 39 °C
Highest Temp.: 39 °C
Health       : 100 %
Performance  : 100 %
Power on time: 1941 days, 3 hours, 35 minutes (estimated)
Est. lifetime: more than 100 days
Total written: 37.85 TB
  The status of the hard disk is perfect.
    No actions needed.
```

## 其他用法

```bash
[root@node001 ~]# ./HDSentinel -h
Hard Disk Sentinel for LINUX console 0.20b-x64.10851 (c) 2023 info@hdsentinel.com
Start with -r [reportfile] to save data to report, -h for help

Parameters:

-r [report]     : save report to file (use report.txt/xml if no name specified
-dump           : dump report to stdout
-xml            : save/dump XML report instead of text
-solid          : solid out (drv, tempC, health%, pow.onHours, model, S/N, sizeMB)
-solidi         : solid out (drv, tempC, health%, pow.onHours, model, S/N, sizeMB, interface)
-dev dev        : detect only the specified device, eg. /dev/sda
-devs d1,d2     : detect (comma separated) devices in addition to default ones eg. /dev/sda,/dev/sdb,/dev/sdc
-onlydevs d1,d2 : detect (comma separated) devices only eg. /dev/sda,/dev/sdb,/dev/sdc
-nodevs d1,d2   : exclude detection of (comma separated) devices eg. /dev/sda,/dev/sdb,/dev/sdc
-h              : display this help
-aam            : display acoustic information also
-setaam drive|ALL level(hex)80-FE|QUIET|LOUD   : set acoustic level
-verbose        : enable verbose output
```
