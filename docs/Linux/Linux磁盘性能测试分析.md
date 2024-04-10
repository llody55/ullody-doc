## fio评测硬盘IO性能

## 原理

> fio是一款开源的磁盘IO性能测试工具，旨在提供一种全方面的测试方案，能够模拟常见的I/O场景，包括随机/顺序读写、读写比例、块大小、I/O深度等参数。其测试结果详细且准确，可用于评估系统磁盘性能、定位瓶颈、优化参数等。

## 安装

```
# RHEL系
yum install fio

# Ubantu系
sudo apt-get install fio
```

## 用法

```bash
# 如下测试命令
fio --name=Test --directory=/tmp --size=1G --rw=randrw --bs=4k --ioengine=libaio --iodepth=64 --numjobs=4 --time_based --runtime=30s

# 相关参数
--name 测试任务的名称
--directory 临时文件存放路径
--size  测试文件大小
--rw 读写
--bs 块大小
--ioengine I/O引擎，有sync, libaio, posixaio等多个选项
--iodepth
--numjobs 测试线程数
--time_based
--runtime  测试时间
```

## 输出如下

```bash
Test: (g=0): rw=randrw, bs=(R) 4096B-4096B, (W) 4096B-4096B, (T) 4096B-4096B, ioengine=libaio, iodepth=64
...
fio-3.7
Starting 4 processes
Test: Laying out IO file (1 file / 1024MiB)
Test: Laying out IO file (1 file / 1024MiB)
Test: Laying out IO file (1 file / 1024MiB)
Test: Laying out IO file (1 file / 1024MiB)
Jobs: 4 (f=4): [m(4)][100.0%][r=59.1MiB/s,w=58.9MiB/s][r=15.1k,w=15.1k IOPS][eta 00m:00s]
Test: (groupid=0, jobs=1): err= 0: pid=26734: Wed Apr 10 09:46:19 2024
   read: IOPS=3672, BW=14.3MiB/s (15.0MB/s)(430MiB/30001msec)
    slat (usec): min=110, max=6434, avg=223.37, stdev=130.82
    clat (usec): min=13, max=36074, avg=8590.01, stdev=1438.67
     lat (usec): min=195, max=36625, avg=8816.19, stdev=1457.33
    clat percentiles (usec):
     |  1.00th=[ 6128],  5.00th=[ 6718], 10.00th=[ 7046], 20.00th=[ 7504],
     | 30.00th=[ 7832], 40.00th=[ 8094], 50.00th=[ 8455], 60.00th=[ 8717],
     | 70.00th=[ 9110], 80.00th=[ 9503], 90.00th=[10290], 95.00th=[11076],
     | 99.00th=[13173], 99.50th=[13960], 99.90th=[16581], 99.95th=[21103],
     | 99.99th=[31327]
   bw (  KiB/s): min=13176, max=15976, per=25.36%, avg=14672.12, stdev=651.39, samples=59
   iops        : min= 3294, max= 3994, avg=3668.00, stdev=162.85, samples=59
  write: IOPS=3662, BW=14.3MiB/s (15.0MB/s)(429MiB/30001msec)
    slat (usec): min=8, max=4056, avg=18.61, stdev=37.35
    clat (usec): min=205, max=36585, avg=8592.49, stdev=1443.17
     lat (usec): min=219, max=36603, avg=8613.44, stdev=1444.88
    clat percentiles (usec):
     |  1.00th=[ 6063],  5.00th=[ 6718], 10.00th=[ 7046], 20.00th=[ 7504],
     | 30.00th=[ 7832], 40.00th=[ 8160], 50.00th=[ 8455], 60.00th=[ 8717],
     | 70.00th=[ 9110], 80.00th=[ 9503], 90.00th=[10159], 95.00th=[11076],
     | 99.00th=[13173], 99.50th=[13960], 99.90th=[17695], 99.95th=[21365],
     | 99.99th=[30540]
   bw (  KiB/s): min=12416, max=16120, per=25.28%, avg=14629.61, stdev=740.66, samples=59
   iops        : min= 3104, max= 4030, avg=3657.36, stdev=185.17, samples=59
  lat (usec)   : 20=0.01%, 250=0.01%, 500=0.01%, 750=0.01%, 1000=0.01%
  lat (msec)   : 2=0.01%, 4=0.01%, 10=87.73%, 20=12.19%, 50=0.07%
  cpu          : usr=9.30%, sys=24.48%, ctx=110194, majf=0, minf=32
  IO depths    : 1=0.1%, 2=0.1%, 4=0.1%, 8=0.1%, 16=0.1%, 32=0.1%, >=64=100.0%
     submit    : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.0%, >=64=0.0%
     complete  : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.1%, >=64=0.0%
     issued rwts: total=110186,109879,0,0 short=0,0,0,0 dropped=0,0,0,0
     latency   : target=0, window=0, percentile=100.00%, depth=64
Test: (groupid=0, jobs=1): err= 0: pid=26735: Wed Apr 10 09:46:19 2024
   read: IOPS=3633, BW=14.2MiB/s (14.9MB/s)(426MiB/30001msec)
    slat (usec): min=118, max=5166, avg=226.14, stdev=129.27
    clat (usec): min=13, max=34833, avg=8655.78, stdev=1454.19
     lat (usec): min=181, max=35339, avg=8884.75, stdev=1472.59
    clat percentiles (usec):
     |  1.00th=[ 6063],  5.00th=[ 6718], 10.00th=[ 7111], 20.00th=[ 7570],
     | 30.00th=[ 7898], 40.00th=[ 8225], 50.00th=[ 8455], 60.00th=[ 8848],
     | 70.00th=[ 9110], 80.00th=[ 9634], 90.00th=[10290], 95.00th=[11207],
     | 99.00th=[13304], 99.50th=[13829], 99.90th=[16057], 99.95th=[20579],
     | 99.99th=[31065]
   bw (  KiB/s): min=13032, max=15832, per=25.09%, avg=14516.29, stdev=688.53, samples=59
   iops        : min= 3258, max= 3958, avg=3629.05, stdev=172.12, samples=59
  write: IOPS=3647, BW=14.2MiB/s (14.9MB/s)(427MiB/30001msec)
    slat (usec): min=8, max=4026, avg=18.69, stdev=36.25
    clat (usec): min=591, max=35320, avg=8653.68, stdev=1460.64
     lat (usec): min=609, max=35345, avg=8674.70, stdev=1462.63
    clat percentiles (usec):
     |  1.00th=[ 6063],  5.00th=[ 6718], 10.00th=[ 7111], 20.00th=[ 7570],
     | 30.00th=[ 7898], 40.00th=[ 8160], 50.00th=[ 8455], 60.00th=[ 8848],
     | 70.00th=[ 9110], 80.00th=[ 9634], 90.00th=[10290], 95.00th=[11076],
     | 99.00th=[13173], 99.50th=[13829], 99.90th=[16450], 99.95th=[20841],
     | 99.99th=[32375]
   bw (  KiB/s): min=12880, max=16024, per=25.16%, avg=14564.81, stdev=765.21, samples=59
   iops        : min= 3220, max= 4006, avg=3641.17, stdev=191.31, samples=59
  lat (usec)   : 20=0.01%, 250=0.01%, 500=0.01%, 750=0.01%, 1000=0.01%
  lat (msec)   : 2=0.01%, 4=0.01%, 10=86.67%, 20=13.25%, 50=0.06%
  cpu          : usr=9.12%, sys=24.38%, ctx=109028, majf=0, minf=31
  IO depths    : 1=0.1%, 2=0.1%, 4=0.1%, 8=0.1%, 16=0.1%, 32=0.1%, >=64=100.0%
     submit    : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.0%, >=64=0.0%
     complete  : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.1%, >=64=0.0%
     issued rwts: total=109022,109439,0,0 short=0,0,0,0 dropped=0,0,0,0
     latency   : target=0, window=0, percentile=100.00%, depth=64
Test: (groupid=0, jobs=1): err= 0: pid=26736: Wed Apr 10 09:46:19 2024
   read: IOPS=3594, BW=14.0MiB/s (14.7MB/s)(421MiB/30001msec)
    slat (usec): min=112, max=5078, avg=229.26, stdev=133.53
    clat (usec): min=72, max=32801, avg=8780.23, stdev=1460.38
     lat (usec): min=264, max=34218, avg=9012.29, stdev=1478.95
    clat percentiles (usec):
     |  1.00th=[ 6259],  5.00th=[ 6915], 10.00th=[ 7242], 20.00th=[ 7701],
     | 30.00th=[ 8029], 40.00th=[ 8291], 50.00th=[ 8586], 60.00th=[ 8848],
     | 70.00th=[ 9241], 80.00th=[ 9634], 90.00th=[10421], 95.00th=[11338],
     | 99.00th=[13435], 99.50th=[14091], 99.90th=[17171], 99.95th=[20841],
     | 99.99th=[30016]
   bw (  KiB/s): min=13040, max=15760, per=24.82%, avg=14358.92, stdev=625.22, samples=59
   iops        : min= 3260, max= 3940, avg=3589.68, stdev=156.29, samples=59
  write: IOPS=3582, BW=13.0MiB/s (14.7MB/s)(420MiB/30001msec)
    slat (usec): min=8, max=3635, avg=18.57, stdev=32.12
    clat (usec): min=13, max=34042, avg=8781.77, stdev=1461.03
     lat (usec): min=28, max=34053, avg=8802.69, stdev=1462.55
    clat percentiles (usec):
     |  1.00th=[ 6259],  5.00th=[ 6915], 10.00th=[ 7242], 20.00th=[ 7701],
     | 30.00th=[ 8029], 40.00th=[ 8291], 50.00th=[ 8586], 60.00th=[ 8848],
     | 70.00th=[ 9241], 80.00th=[ 9634], 90.00th=[10421], 95.00th=[11338],
     | 99.00th=[13435], 99.50th=[14091], 99.90th=[18220], 99.95th=[21890],
     | 99.99th=[29230]
   bw (  KiB/s): min=12656, max=15856, per=24.73%, avg=14311.76, stdev=681.11, samples=59
   iops        : min= 3164, max= 3964, avg=3577.88, stdev=170.27, samples=59
  lat (usec)   : 20=0.01%, 50=0.01%, 100=0.01%, 500=0.01%, 750=0.01%
  lat (usec)   : 1000=0.01%
  lat (msec)   : 2=0.01%, 4=0.01%, 10=85.25%, 20=14.67%, 50=0.07%
  cpu          : usr=9.04%, sys=24.13%, ctx=107835, majf=0, minf=32
  IO depths    : 1=0.1%, 2=0.1%, 4=0.1%, 8=0.1%, 16=0.1%, 32=0.1%, >=64=100.0%
     submit    : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.0%, >=64=0.0%
     complete  : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.1%, >=64=0.0%
     issued rwts: total=107825,107483,0,0 short=0,0,0,0 dropped=0,0,0,0
     latency   : target=0, window=0, percentile=100.00%, depth=64
Test: (groupid=0, jobs=1): err= 0: pid=26737: Wed Apr 10 09:46:19 2024
   read: IOPS=3562, BW=13.9MiB/s (14.6MB/s)(418MiB/30001msec)
    slat (usec): min=116, max=13974, avg=231.58, stdev=139.79
    clat (usec): min=14, max=35238, avg=8832.57, stdev=1496.57
     lat (usec): min=247, max=35992, avg=9066.94, stdev=1514.92
    clat percentiles (usec):
     |  1.00th=[ 6259],  5.00th=[ 6915], 10.00th=[ 7242], 20.00th=[ 7701],
     | 30.00th=[ 8029], 40.00th=[ 8356], 50.00th=[ 8586], 60.00th=[ 8979],
     | 70.00th=[ 9372], 80.00th=[ 9765], 90.00th=[10552], 95.00th=[11469],
     | 99.00th=[13566], 99.50th=[14222], 99.90th=[18744], 99.95th=[22152],
     | 99.99th=[30278]
   bw (  KiB/s): min=12952, max=15352, per=24.62%, avg=14244.87, stdev=619.90, samples=60
   iops        : min= 3238, max= 3838, avg=3561.18, stdev=154.97, samples=60
  write: IOPS=3577, BW=13.0MiB/s (14.7MB/s)(419MiB/30001msec)
    slat (usec): min=8, max=3871, avg=18.62, stdev=33.33
    clat (usec): min=452, max=35666, avg=8819.81, stdev=1489.03
     lat (usec): min=475, max=35709, avg=8840.74, stdev=1490.54
    clat percentiles (usec):
     |  1.00th=[ 6259],  5.00th=[ 6915], 10.00th=[ 7242], 20.00th=[ 7701],
     | 30.00th=[ 8029], 40.00th=[ 8356], 50.00th=[ 8586], 60.00th=[ 8979],
     | 70.00th=[ 9241], 80.00th=[ 9765], 90.00th=[10552], 95.00th=[11338],
     | 99.00th=[13566], 99.50th=[14222], 99.90th=[18482], 99.95th=[21890],
     | 99.99th=[33424]
   bw (  KiB/s): min=12568, max=16064, per=24.71%, avg=14303.50, stdev=828.50, samples=60
   iops        : min= 3142, max= 4016, avg=3575.85, stdev=207.11, samples=60
  lat (usec)   : 20=0.01%, 500=0.01%, 1000=0.01%
  lat (msec)   : 2=0.01%, 4=0.01%, 10=83.99%, 20=15.92%, 50=0.08%
  cpu          : usr=9.11%, sys=24.11%, ctx=106895, majf=0, minf=29
  IO depths    : 1=0.1%, 2=0.1%, 4=0.1%, 8=0.1%, 16=0.1%, 32=0.1%, >=64=100.0%
     submit    : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.0%, >=64=0.0%
     complete  : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.1%, >=64=0.0%
     issued rwts: total=106887,107319,0,0 short=0,0,0,0 dropped=0,0,0,0
     latency   : target=0, window=0, percentile=100.00%, depth=64

Run status group 0 (all jobs):
   READ: bw=56.5MiB/s (59.2MB/s), 13.9MiB/s-14.3MiB/s (14.6MB/s-15.0MB/s), io=1695MiB (1777MB), run=30001-30001msec
  WRITE: bw=56.5MiB/s (59.3MB/s), 13.0MiB/s-14.3MiB/s (14.7MB/s-15.0MB/s), io=1696MiB (1778MB), run=30001-30001msec

Disk stats (read/write):
    dm-0: ios=433325/90, merge=0/0, ticks=83217/266, in_queue=83856, util=98.06%, aggrios=433920/85, aggrmerge=0/5, aggrticks=82718/252, aggrin_queue=82970, aggrutil=99.33%
  vda: ios=433920/85, merge=0/5, ticks=82718/252, in_queue=82970, util=99.33%
```

## 分析

```bash
# 启用4个任务
Jobs: 4 (f=4): [m(4)][100.0%][r=59.1MiB/s,w=58.9MiB/s][r=15.1k,w=15.1k IOPS][eta 00m:00s]
# 读取性能 （READ）: 14.3MB/s。
read: IOPS=3672, BW=14.3MiB/s (15.0MB/s)(430MiB/30001msec)
# 写入速度 （WRITE）: 14.3MiB/s
write: IOPS=3662, BW=14.3MiB/s (15.0MB/s)(429MiB/30001msec)
# 平均读取延迟(read lat) : 8816ms
lat (usec): min=195, max=36625, avg=8816.19, stdev=1457.33
# 平均写入延迟(write clat): 
clat (usec): min=205, max=36585, avg=8592.49, stdev=1443.17
# IO 深度（IO depths）: 64 大多数操作的 IO 深度超过 64，表明系统对于 IO 请求的并发处理能力较强。
IO depths    : 1=0.1%, 2=0.1%, 4=0.1%, 8=0.1%, 16=0.1%, 32=0.1%, >=64=100.0%
# 磁盘利用率(util): 在 98.06% ，处于较高水平，表明磁盘的工作负载较重。
Disk stats (read/write):
    dm-0: ios=433325/90, merge=0/0, ticks=83217/266, in_queue=83856, util=98.06%, 
# 磁盘统计信息: 磁盘的 IO 操作数较多，dm-0 和 vda 的 IO 操作数都在数十万次左右。
aggrios=433920/85, aggrmerge=0/5, aggrticks=82718/252, aggrin_queue=82970, 
```

> 该磁盘在当前测试条件下的性能表现良好，读写速度相当，并且具有较低的延迟和较高的并发处理能力。然而，由于 CPU 使用率较高且磁盘利用率接近满负荷，可能存在进一步优化的空间，例如通过调整系统参数或升级硬件来提升性能。

## 总结

> fio是一款性能测试工具，可以帮助我们评估系统的磁盘IO性能，找到瓶颈和优化方向。在测试过程中，我们需要考虑多个测试参数，并根据实际情况进行调整和优化。通过了解fio的操作方法和测试结果分析，可以更好地利用该工具，并在实际应用中提高系统性能和效率。
