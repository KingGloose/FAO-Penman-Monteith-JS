# 介绍

该库使用 JavaScript 实现对 FAOPenmanMonteith 高精度的模拟运算 [ [Penman Monteith公式 - 维基百科，自由的百科全书 (wikipedia.org)](https://zh.wikipedia.org/wiki/Penman_Monteith公式) ]，目前公式来源基于书籍 **作物腾发量 - 作物需水量计算指南** 来做理论实现



# 使用

## 安装

`npm i` ，如果您需要将该代码迁移到别处，请使用 `npm i mathjs`



## 快速使用

```javascript
import FAOPenmanMonteith from "xxx/xxx/FAOPenmanMonteith"

const f = new FAOPenmanMonteith({
     temMax: 21.5,
     temMin: 12.3,
     rhMax: 0.84,
     rhMin: 0.63,
     height: 100,
     latitude: 50.8,
     windSpeedAtxm: [10, 2.78],
     actualSunTime: 9.25,
     // windSpeedAt2m: 2.078,
   },
   { precision: 10 }
)
f.start() // 执行计算
```



# API

## 创建实例

```javascript
const f = new FAOPenmanMonteith(
	{ ...atmosphereOptions }, 
	{ ...MathConfigOptions }
)
```



### atmosphereOptions

该参数作为第一个参数传入，主要包含气象信息，请参考如下

| key             | name                             | isRequired                             | others                                                 |
| --------------- | -------------------------------- | -------------------------------------- | ------------------------------------------------------ |
| temMax          | 每天的最高气温                   | true                                   |                                                        |
| temMin          | 每天的最低气温                   | true                                   |                                                        |
| avgTemPrevMonth | 前一个月的平均气温               | false                                  |                                                        |
| avgTemCurrMonth | 这个月的平均气温                 | false                                  |                                                        |
| avgTemNextMonth | 去年中这个月的后一个月得平均温度 | false                                  | 比如今年为2024年6月, 那么就需要2023年的5月的数据       |
| stationPres     | 站点大气压强                     | false                                  | 如果存在即可直接使用, 如果没有可以使用站点海拔高度计算 |
| latitude        | 站点纬度                         | true                                   |                                                        |
| height          | 海拔高度                         | true                                   |                                                        |
| rhMax           | 相对湿度最大值                   | true                                   |                                                        |
| rhMin           | 相对湿度最小值                   | true                                   |                                                        |
| actualSunTime   | 实际日照持续时间                 | true                                   |                                                        |
| windSpeedAt2m   | 2米高度处的风速                  | windSpeedAt2m和windSpeedAtxm必须传一个 |                                                        |
| windSpeedAtxm   | x米高度处的风速                  |                                        | [10, 1.2] -> 10米高风速为1.2m/s                        |
| as              | as                               | false                                  | 默认值为0.25                                           |
| bs              | bs                               | false                                  | 默认值为0.5                                            |
| alpha           | 反射率或冠层反射系数             | false                                  | 以草为假想的参考作物时，α值为0.23（无量纲）            |
| timestamp       | 时间戳                           |                                        | 用于计算日序值, 如果不传入就使用当天时间               |



### MathConfigOptions

mathjs 配置，用于实例化 mathjs

参考文档：[math.js | an extensive math library for JavaScript and Node.js (mathjs.org)](https://mathjs.org/docs/core/configuration.html)



## start

会按照传入的气象数据来计算最终值 参照腾发量

```javascript
f.start()
```



## getCache

获取缓存的数据

```
f.getCache()
```



## executeFAOMapping

执行 FAO 映射，faoObj  用于计算的 FAO 对象，isCache 表示该值是否缓存，...args 传入参数

```
f.executeFAOMapping(faoObj, isCache)(...args)
```



# 未来规划

## 已完成

1、缺少气象数值时存在替补 ET0 计算  （√）

2、补充 TS  （√）

3、优化计算过程、参数传递   （√）

## 待完成

1、目前只写了每日 ET0 计算，还存在很多时间刻度的计算

2、还存在例如 kc、etc 的计算

3、实现自动化测试，给个excel或者其他格式写入数据自动输出数据，并完成报表
