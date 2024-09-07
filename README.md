# FAO-Penman-Monteith-JS
> 背景

该库主要使用 JavaScript 下的 Math.js 来模拟 **FAO Penman-Monteith  ET0** 公式计算，该库的公式主要基于书籍 **作物腾发量 - 作物需水量计算指南**



> 使用

1、 `npm i mathjs`

2、使用 new 的方式来传入参数

3、使用 done() 来执行计算过程、使用 params() 来获取计算产生的中间值

```javascript
const f = new FAOPenmanMonteith({ 
  TMax: 21.5, 
  TMin: 12.3, 
  RHMax: 0.84, 
  RHMin: 0.63,
  height: 100,
  alt: 50.80,
  n: 9.25,
  uz: [10, 2.78],
  timestamp: new Date().getTime(),
})
f.J = 187
f.done()
```



> 未来规划

1、目前只写了每日 ET0 计算，还存在很多时间刻度的计算

2、缺少气象数值时存在替补 ET0 计算

3、补充 TS

4、优化计算过程、参数传递 
