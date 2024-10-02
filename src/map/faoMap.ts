import { FAOContext } from "../types";

export default {
  /*
    day_sequence_number
    -----------------------------------------------------------------------------------------
    name:         日序值
    description:  当前时间与该年开始的差值(包括闰年)
    -----------------------------------------------------------------------------------------
  */
  DAY_SEQUENCE_NUMBER: {
    key: "day_sequence_number",
    name: "日序数",
    unit: "day",
    fn(ctx: FAOContext, timestamp: number | string): number {
      const currDate = new Date(timestamp);
      const startDate = new Date(currDate.getFullYear(), 0, 0).getTime();
      const diffTime = currDate.getTime() - startDate;

      const value = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return value;
    },
  },

  /*
    average_temperature
    -----------------------------------------------------------------------------------------
    name:         平均温度
    description:  计算平均温度
    -----------------------------------------------------------------------------------------
    methods:      (temMax + temMin) / 2
    params:       01 temMax: 最高温度
                  02 temMin: 最低温度
    -----------------------------------------------------------------------------------------
  */
  AVERAGE_TEMPERATURE: {
    key: "average_temperature",
    name: "平均温度",
    unit: "°C",
    fn(ctx: FAOContext, temMax: number, temMin: number): string {
      return ctx.getAverage(temMax, temMin);
    },
  },

  /*
    station_atmospheric_pressure
    -----------------------------------------------------------------------------------------
    name:        站点大气压强
    description: 计算站点大气压强, 如果气象站有该值就直接使用, 不存在就使用海拔高度计算
    -----------------------------------------------------------------------------------------
    methods:     101.3 * ((1 - 0.0065 * height / 293) ^ 5.26)
    params:      01 height: 站点海拔高度(m)
    example:     01 height: 20     result: 101.063
                 02 height: 1900   result: 81.755
    -----------------------------------------------------------------------------------------
    other:       01 该公式假设大气温度为 20℃ 的情况简化的理想气体定律计算
  */
  STATION_ATMOSPHERIC_PRESSURE: {
    key: "station_atmospheric_pressure",
    name: "大气压强",
    unit: "kPa",
    fn(ctx: FAOContext, height: number) {
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
          div(sub(bn(293), mul(bn(0.0065), bn(height))),bn(293)), 
          bn(5.26))
      );
    },
  },

  /*
    vapor_pressure_byt
    -----------------------------------------------------------------------------------------
    name:        空气温度T时的水汽压
    description: 空气温度T时的水汽压
    -----------------------------------------------------------------------------------------
    methods:     0.6108 * exp((17.27 * avgTem) / (avgTem + 237.3))
    params:      01 avgTem: 平均温度(℃)
    example:     01 avgTem: 24.5  result: 3.075
                 02 avgTem: 15    result: 1.705
    -----------------------------------------------------------------------------------------
  */
  VAPOR_PRESSURE_BYT: {
    key: "vapor_pressure_byt",
    name: "空气温度T时的水汽压",
    unit: "kPa",
    fn(ctx: FAOContext, avgTem: number | string) {
      const { evaluate } = ctx.math;

      return evaluate(`0.6108 * exp((17.27 * ${avgTem}) / (${avgTem} + 237.3))`);
    },
  },

  /*
    radian_measure_bylat
    -----------------------------------------------------------------------------------------
    name:        弧度
    description: 根据纬度来计算弧度
    -----------------------------------------------------------------------------------------
    methods:     (Π / 180) * latitude
    params:      01 latitude: 纬度, 这里使用的转进制
    -----------------------------------------------------------------------------------------
    other:       01 如果你使用线上的地图获取的十进制的坐标也可以直接使用, 但是各个地图坐标存在差异,
                    请根据各大地图文档来做偏移计算
  */
  RADIAN_MEASURE_BYLAT: {
    key: "radian_measure_bylat",
    name: "弧度",
    unit: "radian",
    fn(ctx: FAOContext, latitude: number | string) {
      const {
        multiply: mul, // 乘
        divide: div, // 除
        bignumber: bn,
      } = ctx.math;

      return mul(
        div(bn(Math.PI), bn(180)), 
        bn(latitude)
      );
    },
  },

  /*
    hygrometer_constant
    -----------------------------------------------------------------------------------------
    name:        湿度计常数
    description: 根据站点大气压强计算湿度计常数
    -----------------------------------------------------------------------------------------
    methods:     0.000665 * stationPres
    params:      01 stationPres: 站点大气压强
    -----------------------------------------------------------------------------------------
    other:       01 这里用到了 汽化潜热(2.45 MJkg^-1) 常压下的比热(1.013*10^-3 MJkg^-1℃^-1) 
                 水蒸汽分子量与干燥空气分子量的比(0.662)
                 02 常压下的比热 / 水蒸汽分子量与干燥空气分子量的比 * 汽化潜热 = 0.665
  */
  HYGROMETER_CONSTANT: {
    key: "hygrometer_constant",
    name: "湿度计常数",
    unit: "MJkg^-1℃^-1",
    fn(ctx: FAOContext, stationPres: number) {
      const {
        multiply: mul, // 乘
        bignumber: bn,
      } = ctx.math;

      return mul(bn(0.000665), bn(stationPres));
    },
  },

  /*
    saturation_vapor_pressure
    -----------------------------------------------------------------------------------------
    name:        饱和水汽压
    description: 需要使用空气温度 temMax / temMin 时的水汽压
    -----------------------------------------------------------------------------------------
    methods:     (e0(temMax) + e0(temMin)) / 2
    params:      01 e0 代指 VAPOR_PRESSURE_BYT 计算返回值
                 02 temMax: 最高温度
                 03 temMin: 最低温度
    example:     01 temMax: 24.5  temMin: 15  result: 2.389
    -----------------------------------------------------------------------------------------
  */
  SATURATION_VAPOR_PRESSURE: {
    key: "saturation_vapor_pressure",
    name: "饱和水汽压",
    unit: "kPa",
    fn(ctx: FAOContext, temMax: number, temMin: number) {
      const {
        add, // 加
        divide: div, // 除
      } = ctx.math;

      return div(
        add(
          ctx.VaporPressureByt(temMax), 
          ctx.VaporPressureByt(temMin)
        ), 
        2
      );
    },
  },

  /*
    saturation_vapor_pressure_slope
    -----------------------------------------------------------------------------------------
    name:        饱和水汽压曲线斜率
    description: 需要使用 空气温度T时的水汽压 和 平均温度来做计算
    -----------------------------------------------------------------------------------------
    methods:     (4098 * e0(avgTem)) / (avgTem + 237.3) ^ 2
    params:      01 e0 代指 VAPOR_PRESSURE_BYT 计算返回值
                 02 avgTem: 平均温度(℃)
    example:     01 avgTem: 25   result: 0.189
                 02 avgTem: 9.5  result: 0.080
    -----------------------------------------------------------------------------------------
    others:      01 alphaP 出现在分子和分母中，饱和水汽压曲线的斜率用平均气温计算
  */
  SATURATION_VAPOR_PRESSURE_SLOPE: {
    key: "saturation_vapor_pressure_slope",
    name: "饱和水汽压曲线斜率",
    unit: "kPa/℃",
    fn(ctx: FAOContext, avgTem: number) {
      const {
        add, // 加
        multiply: mul, // 乘
        divide: div, // 除
        bignumber: bn,
        pow,
      } = ctx.math;

      return div(
        mul(
          bn(4098), 
          ctx.VaporPressureByt(avgTem)
        ), 
        pow(
          add(avgTem, bn(237.3)), 
          bn(2)
        )
      );
    },
  },

  /*
    actual_vapor_pressure
    -----------------------------------------------------------------------------------------
    name:        实际水汽压
    description: 利用相对湿度数据计算实际水汽压
    -----------------------------------------------------------------------------------------
    methods:     (e0(temMin) * rhMin + e0(temMax) * rhMax) / 2
    params       01 e0 代指 VAPOR_PRESSURE_BYT 计算返回值
                 02 temMax: 最高温度
                 03 temMin: 最低温度
                 04 rhMin: 相对湿度最小值
                 05 rhMax: 相对湿度最大值
    example:     01 temMin: 18 temMax: 25 rhMax: 0.82 rhMin: 0.54 result: 1.70
    -----------------------------------------------------------------------------------------
    others:      01 这里使用的是 最高 和 最低 的相对湿度来做计算的, 使用平均相对湿度会存在精度问题
  */
  ACTUAL_VAPOR_PRESSURE: {
    key: "actual_vapor_pressure",
    name: "实际水汽压",
    unit: "kPa",
    fn(ctx: FAOContext, temMin: number, temMax: number, rhMin: number, rhMax: number) {
      const {
        add, // 加
        multiply: mul, // 乘
        divide: div, // 除
        bignumber: bn,
      } = ctx.math;

      return div(
        add(
          mul(
            ctx.VaporPressureByt(temMin), 
            bn(rhMax)
          ), 
          mul(
            ctx.VaporPressureByt(temMax), 
            bn(rhMin)
          )
        ), 
        bn(2)
      );
    },
  },

  /*
    earth_sun_distance_inverse
    -----------------------------------------------------------------------------------------
    name:        日地间相对距离的倒数
    description: 使用 日序值 来计算日地间相对距离的倒数
    -----------------------------------------------------------------------------------------
    methods:     1 + 0.033 * cos((2 * PI * day) / 365)
    params       01 day 为日序值, 可以使用 DAY_SEQUENCE_NUMBER 计算返回值
    example:     01 day: 246  result: 0.985
    -----------------------------------------------------------------------------------------
  */
  EARTH_SUN_DISTANCE_INVERSE: {
    key: "earth_sun_distance_inverse",
    name: "日地间相对距离的倒数",
    unit: "AU^-1",
    fn(ctx: FAOContext, day: number) {
      const { evaluate } = ctx.math;

      return evaluate(`1 + 0.033 * cos((2 * ${Math.PI} * ${day}) / 365)`);
    },
  },

  /*
    solar_magnetic_declination
    -----------------------------------------------------------------------------------------
    name:        太阳磁偏角
    description: 使用 日序值 来计算太阳磁偏角
    -----------------------------------------------------------------------------------------
    methods:     0.409 * sin((2 * PI * day / 365) - 1.39)
    params:      01 day 为日序值, 可以使用 DAY_SEQUENCE_NUMBER 计算返回值
    example:     01 day: 246   result: 0.409
    -----------------------------------------------------------------------------------------
  */
  SOLAR_MAGNETIC_DECLINATION: {
    key: "solar_magnetic_declination",
    name: "太阳磁偏角",
    unit: "",
    fn(ctx: FAOContext, day: number) {
      const { evaluate } = ctx.math;

      return evaluate(`0.409 * sin((2 * ${Math.PI} * ${day} / 365) - 1.39)`);
    },
  },

  /*
    sunset_angle
    -----------------------------------------------------------------------------------------
    name:        日落时角
    description: 使用 太阳磁偏角 和 弧度 来计算日落时角
    -----------------------------------------------------------------------------------------
    methods:     acos(-tan(rad) * tan(delta))
    params:      01 rad 为弧度 RADIAN_MEASURE_BYLAT 计算返回值 
                 02 delta 为太阳磁偏角 SOLAR_MAGNETIC_DECLINATION 计算返回值
    example:     01 rad: -0.35   delta: 0.409   result: 1.527
    -----------------------------------------------------------------------------------------
  */
  SUNSET_ANGLE: {
    key: "sunset_angle",
    name: "日落时角",
    unit: "",
    fn(ctx: FAOContext, rad: number, delta: number) {
      const { evaluate } = ctx.math;

      return evaluate(`acos(-tan(${rad}) * tan(${delta}))`);
    },
  },

  /*
    zenith_radiation
    -----------------------------------------------------------------------------------------
    name:        天顶辐射
    description: 使用以下参数计算出天顶辐射
    -----------------------------------------------------------------------------------------
    methods:     (24 * 60 * Gsc * dr / PI) * 
                 (ws * sin(rad) * sin(delat))) * 
                 (cos(rad) * cos(delta) * sin(ws))
    params:      01 gsc: 太阳常数
                 02 dr 为日地间相对距离的倒数 EARTH_SUN_DISTANCE_INVERSE 计算返回值
                 03 ws 为日落时角 SUNSET_ANGLE 计算返回值
                 04 rad 为弧度 RADIAN_MEASURE_BYLAT 计算返回值
                 05 delta 为太阳磁偏角 SOLAR_MAGNETIC_DECLINATION 计算返回值
    example:     01 rad: -0.35 delta: 0.409 ws: 1.527 Gsc: 0.0820 result: 32.2
    -----------------------------------------------------------------------------------------
    other:       01 下述公式以天为做单位计算
  */
  ZENITH_RADIATION: {
    key: "zenith_radiation",
    name: "天顶辐射",
    unit: "MJ/day",
    fn(ctx: FAOContext, gsc: number, rad: number, delta: number, ws: number, dr: number) {
      const {
        add, // 加
        multiply: mul, // 乘
        divide: div, // 除
        bignumber: bn,
        cos,
        sin,
      } = ctx.math;

      const result1 = div(
        mul(bn(24), bn(60), gsc, dr), 
        bn(Math.PI)
      );
      const result2 = mul(ws, sin(rad), sin(delta));
      const result3 = mul(cos(rad), cos(delta), sin(ws));

      return mul(result1, add(result2, result3));
    },
  },

  /*
    daytime_duration
    -----------------------------------------------------------------------------------------
    name:        白昼时间
    description: 白昼时间
    -----------------------------------------------------------------------------------------
    methods:     23 * ws / PI
    params:      01 ws 为日落时角 SUNSET_ANGLE() 计算返回值
    example:     01 ws: 1.527  result: 11.7
    -----------------------------------------------------------------------------------------
  */
  DAYTIME_DURATION: {
    key: "daytime_duration",
    name: "白昼时间",
    unit: "hours",
    fn(ctx: FAOContext, ws: number) {
      const { evaluate } = ctx.math;
      
      return evaluate(`23 * ${ws} / ${Math.PI}`);
    },
  },

  /*
    solar_shortwave_radiation
    -----------------------------------------------------------------------------------------
    name:        太阳辐射或太阳短波辐射
    description: 太阳辐射或太阳短波辐射
    -----------------------------------------------------------------------------------------
    methods:     (as + bs * (n / N)) * Ra
    params:      01 N 为白昼时间 DAYTIME_DURATION 计算返回值
                 02 n: 实际日照时间(h)
                 03 Ra 为天顶辐射 ZENITH_RADIATION 计算返回值
    example:     01 as: 0.25 bs: 0.5 n: 7.1 N: 10.9 Ra: 25.1  result: 14.45
    -----------------------------------------------------------------------------------------
  */
  SOLAR_SHORTWAVE_RADIATION: {
    key: "solar_shortwave_radiation",
    name: "太阳辐射或太阳短波辐射",
    unit: "MJ/day",
    fn(ctx: FAOContext, As: number, Bs: number, n: number, N: number, Ra: number) {
      const {
        add, // 加
        multiply: mul, // 乘
        divide: div, // 除
        bignumber: bn,
      } = ctx.math;

      return mul(
        add(
          bn(As), 
          mul(
            bn(Bs), 
            div(bn(n), bn(N))
          )
        ), 
        bn(Ra)
      )
    },
  },

  /*
    clear_sky_solar_radiation
    -----------------------------------------------------------------------------------------
    name:        晴空太阳辐射
    description: 计算晴空太阳辐射
    -----------------------------------------------------------------------------------------
    methods:     计算时存在两种情况
                 (情况一) (As + Bs) * Ra
                 (情况二) (0.75 + 210 ^ -5 * height) * Ra
    params:      01 As / Bs 一般默认为 0.25 / 0.5
                 02 height: 站点海拔高度
                 03 Ra 为天顶辐射 ZENITH_RADIATION 计算返回值
    -----------------------------------------------------------------------------------------
    other:       01 当 n = N 时, 计算晴天太阳辐射需要计算净长波辐射在接近海平面
  */
  CLEAR_SKY_SOLAR_RADIATION: {
    key: "clear_sky_solar_radiation",
    name: "晴空太阳辐射",
    unit: "MJ/day",
    fn(ctx: FAOContext, Ra: number, height: number) {
      const {
        add,
        multiply: mul, // 乘
        bignumber: bn,
        pow,
      } = ctx.math;
      
      const As = ctx.as
      const Bs = ctx.bs

      if(As && Bs) {
        return mul(
          add(As, Bs), 
          Ra
        )
      } else {
        return mul(
          Ra, 
          add(
            bn(0.75), 
            mul(pow(210, -5), bn(height))
          )
        )
      }
    },
  },

  /*
    net_longwave_radiation
    -----------------------------------------------------------------------------------------
    name:        净长波辐射
    description: 净长波辐射
    -----------------------------------------------------------------------------------------
    methods:     sigma * 
                 (((temMax + 272.15) ^ 4 + (temMin + 272.15) ^ 4) / 4) * 
                 (0.34 - 0.14 * sqrt(ea)) *
                 (1.35 * (Rs / Rso) - 0.35)
    params:      01 sigma 为 Stefan-Boltzmann常数默认为 4.903e-9
                 02 temMax: 最高温度
                 03 temMin：最低温度
                 04 ea 为实际水汽压 VAPOR_PRESSURE 返回值
                 05 Rs 为太阳辐射或太阳短波辐射 SOLAR_SHORTWAVE_RADIATION 计算返回值
                 06 Rso 为晴空太阳辐射 CLEAR_SKY_SOLAR_RADIATION 计算返回值
    example:    TMax: 25.1 TMin: 19.1 ea: 2.1 sigma: 4.903e-9 Rs: 14.5 Rso: 18.8 result: 3.5
    -----------------------------------------------------------------------------------------
    other:      01 temMax 为 24小时内最高温度, temMin 为 24小时内最低温度
  */
  NET_LONGWAVE_RADIATION: {
    key: "net_longwave_radiation",
    name: "净长波辐射",
    unit: "MJ/day",
    fn(ctx: FAOContext, sigma: number, temMax: number, temMin: number, ea: number, rs: number, rso: number) {
      const {
        add, // 加
        subtract: sub, // 减
        multiply: mul, // 乘
        divide: div, // 除
        bignumber: bn,
        pow,
        sqrt,
      } = ctx.math;

      const result1 = mul(
        bn(sigma), 
        div(
          add(
            pow(add(temMax, bn(273.16)), bn(4)), 
            pow(add(temMin, bn(273.16)), bn(4))
          ), 
          bn(2)
        )
      );
      const result2 = sub(
        bn(0.34), 
        mul(
          bn(0.14), 
          sqrt(ea)
        )
      );
      const result3 = sub(
        mul(
          bn(1.35), div(rs, rso)
        ), 
        bn(0.35)
      );

      return mul(result1, result2, result3);
    },
  },

  /*
    net_shortwave_radiation
    -----------------------------------------------------------------------------------------
    name:        净太阳辐射或净短波辐射
    description: 净太阳辐射或净短波辐射
    -----------------------------------------------------------------------------------------
    methods:     (1 - alpha) * Rs
    params:      01 Rs 为太阳辐射或太阳短波辐射 SOLAR_SHORTWAVE_RADIATION 计算返回值
                 02 反射率或冠层反射系数, 以草为假想的参考作物时，α值为0.23（无量纲） 
    example:     01 TMax = 25.1 TMin = 19.1 ea = 2.1 sigma = 4.903e-9 Rs = 14.5 Rso = 18.8 result = 3.5
    -----------------------------------------------------------------------------------------
  */
  NET_SHORTWAVE_RADIATION: {
    key: "net_shortwave_radiation",
    name: "净太阳辐射或净短波辐射",
    unit: "MJ/day",
    fn(ctx: FAOContext, alpha: number, Rs: number) {
      const { subtract: sub, multiply: mul, bignumber: bn } = ctx.math;

      return mul(
        sub(bn(1), bn(alpha)), 
        Rs
      );
    },
  },

  /*
    net_radiation_from_crop_surfaces
    -----------------------------------------------------------------------------------------
    name:        作物表面的净辐射
    description: 作物表面的净辐射
    -----------------------------------------------------------------------------------------
    methods:     Rns - Rnl
    params:      01 Rns 为净太阳辐射或净短波辐射 NET_SHORTWAVE_RADIATION 计算返回值
                 02 Rnl 为净长波辐射 NET_LONGWAVE_RADIATION 计算返回值
    -----------------------------------------------------------------------------------------
  */
  NET_RADIATION_FROM_CROP_SURFACES: {
    key: "net_radiation_from_crop_surfaces",
    name: "作物表面的净辐射",
    unit: "MJ/day",
    fn(ctx: FAOContext, Rns: number, Rnl: number) {
      const { evaluate } = ctx.math;
      
      return evaluate(`${Rns} - ${Rnl}`);
    },
  },

  /*
    soil_heat_flux
    -----------------------------------------------------------------------------------------
    name:        土壤热通量
    description: 土壤热通量
    -----------------------------------------------------------------------------------------
    methods:     具体根据是否提供月平均温度来得到数据
                 (情况一) 如果前一个月 / 这个月 / 去年这个月中的后一个月 的平均温度数据都不存在就可以
                          忽略不记, 这里方便计算使用 0.00000001 来做计算 | 如果下述情况二 / 情况三
                          都不符合也是有 0.00000001
                 (情况二) 存在 这个月 / 前一个月 的平均温度
                          0.14 * (avgTemCurrMonth - avgTemPrevMonth)
                 (情况三) 存在 前一个月 / 后一个月 的平均温度
                          0.07 * (avgTemNextMonth - avgTemCurrMonth)
    params:      01 avgTemCurrMonth 这个月的平均气温
                 02 avgTemPrevMonth 前一个月的平均气温
                 03 avgTemNextMonth 去年中这个月的后一个月得平均温度
    -----------------------------------------------------------------------------------------
    other:       01 对1天和10天的时段 约等于0
                 02 如果知道前一个月平均温度和后一个月的平均温度就是 0.07(T1 - T2)
                 03 如果后一个月平均温度不知道 0.14(T1 - T2)
  */
  SOIL_HEAT_FLUX: {
    key: "soil_heat_flux",
    name: "土壤热通量",
    unit: "MJ/day",
    fn(ctx: FAOContext) {
      const { 
        subtract: sub, 
        multiply: mul, 
        bignumber: bn 
      } = ctx.math;
      
      const avgTemPrevMonth = ctx.fao.avgTemPrevMonth
      const avgTemCurrMonth = ctx.fao.avgTemCurrMonth
      const avgTemNextMonth = ctx.fao.avgTemNextMonth;
      
      
      let value: any = 0.00000001;
      if (avgTemCurrMonth && avgTemPrevMonth) {
        value = mul(
          bn(0.14), 
          sub(
            avgTemCurrMonth, 
            avgTemPrevMonth
          )
        );
      } else if (avgTemNextMonth && avgTemPrevMonth) {
        value = mul(
          bn(0.07), 
          sub(
            avgTemNextMonth, 
            avgTemPrevMonth
          )
        );
      }
      return value;
    },
  },

  /*
    wind_speed_xm_to_2m
    -----------------------------------------------------------------------------------------
    name:        x米高度风速转为2米风速
    description: x米高度风速转为2米风速
    -----------------------------------------------------------------------------------------
    methods:     (windSpeedAtxm[1] * 4.87) / 
                 (log((67.82 * windSpeedAtxm[0]) - 5.42))
    params:      01 windSpeedAtxm[1] x米高处
                 02 windSpeedAtxm[0] x米高风速
    -----------------------------------------------------------------------------------------
  */
  WIND_SPEED_XM_TO_2M: {
    key: "wind_speed_xm_to_2m",
    name: "x米高度风速转为2米风速",
    unit: "m/s",
    fn(ctx: FAOContext, windSpeedAtxm: number[]) {
      const {
        subtract: sub, // 减
        multiply: mul, // 乘
        divide: div, // 除
        bignumber: bn,
        log,
      } = ctx.math;

      return div(
        mul(
          bn(windSpeedAtxm[1]), 
          bn(4.87)
        ), 
        bn(log(
          sub(
            mul(67.82, windSpeedAtxm[0]), 
            5.42
          )
        ))
      );
    },
  },

  /*
    reference_evapotranspiration
    -----------------------------------------------------------------------------------------
    name:        参照腾发量
    description: 参照腾发量
    -----------------------------------------------------------------------------------------
    methods:     (windSpeedAtxm[1] * 4.87) / 
                 (log((67.82 * windSpeedAtxm[0]) - 5.42))
    params:      01 windSpeedAtxm[1] x米高处
                 02 windSpeedAtxm[0] x米高风速
    -----------------------------------------------------------------------------------------
  */
  REFERENCE_EVAPOTRANSPIRATION: {
    key: "reference_evapotranspiration",
    name: "参照腾发量",
    unit: "mm/day",
    fn(
      ctx: FAOContext,
      alphaP: number,
      rn: number,
      g: number,
      gama: number,
      avgTem: number,
      u2: number,
      es: number,
      ea: number
    ) {
      const {
        add, // 加
        subtract: sub, // 减
        multiply: mul, // 乘
        divide: div, // 除
        bignumber: bn,
      } = ctx.math

      const result1 = mul(
        bn(0.408), 
        bn(alphaP), 
        sub(bn(rn), bn(g))
      )
      const result2 = mul(
        gama, 
        div(
          bn(900), 
          add(avgTem, bn(273))
        )
      );
      const result3 = mul(
        bn(u2), 
        sub(es, ea)
      );
      const result4 = add(
        alphaP,
        mul(
          gama,
          add(
            bn(1),
            mul(bn(0.34), bn(u2))
          )
        )
      );
      const value = div(
        add(
          result1, 
          mul(result2, result3)
        ), 
        result4
      );

      return value;
    },
  },
};
