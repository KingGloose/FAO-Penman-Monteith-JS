import { FAOContext } from "../types";

export default {
  /*
    day_sequence_number
    name:         日序值
    description:  当前时间与该年开始的差值(包括闰年)
  */
  DAY_SEQUENCE_NUMBER: {
    key: "day_sequence_number",
    name: "日序数",
    unit: "day",
    fn(ctx: FAOContext, timestamp: number | string = Date.now()): number {
      const currDate = new Date(timestamp);
      const startDate = new Date(currDate.getFullYear(), 0, 0).getTime();
      const diffTime = currDate.getTime() - startDate;

      const value = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return value;
    },
  },

  /*
    average_temperature
    name:         平均温度
    description:  计算平均温度
  */
  AVERAGE_TEMPERATURE: {
    key: "average_temperature",
    name: "平均温度",
    unit: "°C",
    fn(ctx: FAOContext, TMax: number, TMin: number): string {
      return ctx.getAverage(TMax, TMin);
    },
  },

  /*
    atmospheric_pressure
    name:        站点大气压强
    description: 计算站点大气压强, 如果气象站有该值就直接使用, 不存在就使用海拔高度计算
    
    methods:     101.3 * ((1 - 0.0065 * height / 293) ^ 5.26)
    example:     height = 20     result = 101.06381054996688762
                 height = 1900   result = 81.755796407644209059
    other:       该公式假设大气温度为 20℃ 的情况简化的理想气体定律计算
  */
  STATION_ATMOSPHERIC_PRESSURE: {
    key: "atmospheric_pressure",
    name: "大气压强",
    unit: "kPa",
    fn(ctx: FAOContext, height:number) {
      const {
        subtract: sub, // 减
        multiply: mul, // 乘
        divide: div, // 除
        bignumber: bn,
        pow,
      } = ctx.math;

      return mul(
        bn(101.3),
        pow(
          div(sub(bn(293), mul(bn(0.0065), bn(height))), bn(293)),
          bn(5.26))
      );
    },
  },

  
};
