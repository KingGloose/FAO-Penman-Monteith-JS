import { ConfigOptions, ConstantNodeDependencies, ctransposeDependencies } from "mathjs";
import baseFAO from "./baseFAO";
import FAOModelMapping from "./FAOModelMapping";
import type { atmosphereOptions } from "../types";

// 计算每日得模型值
class FAOPenmanMonteith extends baseFAO {
  /*
    name:       是否为南北半球
    isRequired: false
    example:    true
    other:      该单位影响弧度计算, 这里默认为北半球来做计算
  */
  private isNorthern: boolean = true;

  /*
    name:       计算模式
    isRequired: false
    example:    1 -> 1day
    other:      标记当前得计算模式, 默认为: 以天为单位得计算模式
  */
  private mode: "day" | "hour" = "day";

  /*
    name:       太阳常数
    isRequired: false
    example:    0.082 MJm^-2min^-1
  */
  private Gsc: number = 0.082;

  /*
    name:       Stefan-Boltzmann常数
    isRequired: false
    example:    4.903e-9 MJK^-4m^-2day^-1
  */
  private sigma: number = 4.903e-9;

  /*
    name:       as / bs
    isRequired: false
    example:    0.25 / 0.5
  */
  public as: number = 0.25;
  public bs: number = 0.5;

  /*
    name:       反射率或冠层反射系数
    isRequired: false
    example:    0.23
    other:      以草为假想的参考作物时，α值为0.23（无量纲）
  */
  private alpha: number = 0.23;

  /*
    name:       此次FAO计算使用的气象数据
    isRequired: false
    example:    { ... } 参考 atmosphereOptions 内部参数
  */
  public atmo: atmosphereOptions | null = null;

  /*
    name:       FAO计算所需的映射关系
    isRequired: true
    example:    { ... } 参考 FAOModelMapping 内部参数
  */
  public fao = FAOModelMapping;

  constructor(atmosphereOptions: atmosphereOptions, mathOptions: ConfigOptions = {}) {
    super(mathOptions);

    // 赋值初始化值
    this.sigma = atmosphereOptions.as ?? 4.903e-9;
    this.as = atmosphereOptions.as ?? 0.25;
    this.bs = atmosphereOptions.bs ?? 0.5;
    this.alpha = atmosphereOptions.alpha ?? 0.23;

    this.atmo = atmosphereOptions;
  }

  // day_sequence_number 日序值
  DaySequenceNumber(): number {
    const timestamp = this.atmo?.timestamp ?? Date.now();

    // return super.executeFAOMapping(this.fao.DAY_SEQUENCE_NUMBER, timestamp);
    return 187;
  }

  // average_temperature 平均温度
  AverageTemperature(): number {
    const temMax = this.atmo?.temMax;
    const temMin = this.atmo?.temMin;

    return super.executeFAOMapping(this.fao.AVERAGE_TEMPERATURE, temMax, temMin);
  }

  // station_atmospheric_pressure 站点大气压强
  StationAtmosphericPressure(): number {
    const temAvg = this.AverageTemperature();

    return super.executeFAOMapping(this.fao.STATION_ATMOSPHERIC_PRESSURE, temAvg);
  }

  // vapor_pressure_byt 空气温度T时的水汽压
  VaporPressureByt(tem: number = this.AverageTemperature()): number {
    return super.executeFAOMapping(this.fao.VAPOR_PRESSURE_BYT, tem);
  }

  // radian_measure 根据纬度来计算弧度
  RadianMeasureByLat(): number {
    const latitude = this.atmo?.latitude;

    return super.executeFAOMapping(this.fao.RADIAN_MEASURE_BYLAT, latitude);
  }

  // hygrometer_constant 湿度计常数
  HygrometerConstant(): number {
    let stationPres = this.atmo?.stationPres;
    if (!stationPres) stationPres = this.StationAtmosphericPressure();

    return super.executeFAOMapping(this.fao.HYGROMETER_CONSTANT, stationPres);
  }

  // saturation_vapor_pressure 饱和水汽压
  SaturationVaporPressure(): number {
    const temMax = this.atmo?.temMax;
    const temMin = this.atmo?.temMin;

    return super.executeFAOMapping(this.fao.SATURATION_VAPOR_PRESSURE, temMax, temMin);
  }

  // saturation_vapor_pressure_slope 饱和水汽压曲线斜率
  SatutationVaporPressureSlope(): number {
    const avgTem = this.AverageTemperature();

    return super.executeFAOMapping(this.fao.SATURATION_VAPOR_PRESSURE_SLOPE, avgTem);
  }

  // actual_vapor_pressure 实际水汽压
  ActualVaporPressure(): number {
    const temMax = this.atmo?.temMax;
    const temMin = this.atmo?.temMin;
    const rhMax = this.atmo?.rhMax;
    const rhMin = this.atmo?.rhMin;

    return super.executeFAOMapping(this.fao.ACTUAL_VAPOR_PRESSURE, temMax, temMin, rhMax, rhMin);
  }

  // earth_sun_distance_inverse 日地间相对距离的倒数
  EarthSunDistanceInverse(): number {
    const day = this.DaySequenceNumber();

    return super.executeFAOMapping(this.fao.EARTH_SUN_DISTANCE_INVERSE, day);
  }

  // solar_magnetic_declination 太阳磁偏角
  SolarMagneticDeclination(): number {
    const day = this.DaySequenceNumber();

    return super.executeFAOMapping(this.fao.SOLAR_MAGNETIC_DECLINATION, day);
  }

  // sunset_angle 日落时角
  SunsetAngle(): number {
    const rad = this.RadianMeasureByLat();
    const delta = this.SolarMagneticDeclination();

    return super.executeFAOMapping(this.fao.SUNSET_ANGLE, rad, delta);
  }

  // zenith_radiation 天顶辐射
  ZenithRadiation(): number {
    const gsc = this.Gsc;
    const rad = this.RadianMeasureByLat();
    const delta = this.SolarMagneticDeclination();
    const ws = this.SunsetAngle();
    const dr = this.EarthSunDistanceInverse();

    return super.executeFAOMapping(this.fao.ZENITH_RADIATION, gsc, rad, delta, ws, dr);
  }

  // daytime_duration 白昼时间
  DaytimeDuration(): number {
    const ws = this.SunsetAngle();

    return super.executeFAOMapping(this.fao.DAYTIME_DURATION, ws);
  }

  // solar_shortwave_radiation 太阳辐射或太阳短波辐射
  SolarShortwaveRadiation(): number {
    const As = this.as;
    const Bs = this.bs;
    const N = this.DaytimeDuration();
    const n = this.atmo?.actualSunTime;
    const Ra = this.ZenithRadiation();

    return super.executeFAOMapping(this.fao.SOLAR_SHORTWAVE_RADIATION, As, Bs, n, N, Ra);
  }

  // clear_sky_solar_radiation 晴空太阳辐射
  ClearSkySolarRadiation(): number {
    const height = this.atmo?.height;
    const ra = this.ZenithRadiation();

    return super.executeFAOMapping(this.fao.CLEAR_SKY_SOLAR_RADIATION, ra, height);
  }

  // net_longwave_radiation 净长波辐射
  NetLongWaveRadiation(): number {
    const sigma = this.sigma;
    const temMax = this.atmo?.temMax;
    const temMin = this.atmo?.temMin;
    const ea = this.ActualVaporPressure();
    const rs = this.SolarShortwaveRadiation();
    const rso = this.ClearSkySolarRadiation();

    return super.executeFAOMapping(this.fao.NET_LONGWAVE_RADIATION, sigma, temMax, temMin, ea, rs, rso);
  }

  // net_shortwave_radiation 净太阳辐射或净短波辐射
  NetShortWaveRadiation(): number {
    const alpha = this.alpha;
    const rs = this.SolarShortwaveRadiation();

    return super.executeFAOMapping(this.fao.NET_SHORTWAVE_RADIATION, alpha, rs);
  }

  // net_radiation_from_crop_surfaces 作物表面的净辐射
  NetRadiationFormCropSurfaces(): number {
    const rns = this.NetShortWaveRadiation();
    const rnl = this.NetLongWaveRadiation();

    return super.executeFAOMapping(this.fao.NET_RADIATION_FROM_CROP_SURFACES, rns, rnl);
  }

  // soil_heat_flux 土壤热通量
  SoilHeatFlux(): number {
    return super.executeFAOMapping(this.fao.SOIL_HEAT_FLUX);
  }

  // wind_speed_xm_to_2m x米高度风速转为2米风速
  WindSpeedXmTo2m(): number {
    const windSpeedAtxm = this.atmo?.windSpeedAtxm;
    const windSpeedAt2m = this.atmo?.windSpeedAt2m;
    if (windSpeedAt2m) return windSpeedAt2m;

    return super.executeFAOMapping(this.fao.WIND_SPEED_XM_TO_2M, windSpeedAtxm);
  }

  // reference_evapotranspiration 参照腾发量
  ReferenceEvapotranspiration(): number {
    const alphaP = this.SatutationVaporPressureSlope(); // 饱和水汽压曲线斜率
    const rn = this.NetRadiationFormCropSurfaces(); // 作物表面的净辐射
    const g = this.SoilHeatFlux(); // 土壤热通量
    const gama = this.HygrometerConstant(); // 湿度计常数
    const avgTem = this.AverageTemperature(); // 平均温度
    const u2 = this.WindSpeedXmTo2m(); // 2m风速
    const es = this.SaturationVaporPressure(); // 饱和水汽压
    const ea = this.ActualVaporPressure(); // 实际水汽压

    return super.executeFAOMapping(this.fao.REFERENCE_EVAPOTRANSPIRATION, alphaP, rn, g, gama, avgTem, u2, es, ea);
  }

  // 开始
  start() {
    return this.ReferenceEvapotranspiration();
  }

  // 获取中间值
  params() {
    return Array.from(this.cacheData).reduce<any>((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
  }
}

// example
// const f = new FAOPenmanMonteith({
//   TMax: 21.5,
//   TMin: 12.3,
//   RHMax: 0.84,
//   RHMin: 0.63,
//   height: 100,
//   alt: 50.80,
//   n: 9.25,
//   uz: [10, 2.78],
//   timestamp: new Date().getTime(),
// })
// f.J = 187

// console.log(new FAOPenmanMonteith().Get_P_ByHeight(300))

// export default FAOPenmanMonteith
const f = new FAOPenmanMonteith(
  {
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
  {
    precision: 10,
  }
);
// console.log(f.StationAtmosphericPressure());
// console.log(f.start(), f.params());

export default FAOPenmanMonteith;

// 此处计算的值以天为单位
// class FAOPenmanMonteith extends baseFAO {

//   // ============================== 中间参数 ==============================

//   // ============================== 最终参数 ==============================

//   /*
//     作物表面的净辐射

//     公式: Rns - Rnl
//   */
//   Rn() {
//     /*
//       弧度

//       公式: (PI / 180) * alt

//       示例数据
//       alt: 20°S  result = -0.35
//     */
//     const rad = this.isNorthern ? this.Get_Rad(this.alt) : mul(bn(-1), this.Get_Rad(this.alt));

//     /*
//       日地间相对距离的倒数

//       公式: 1 + 0.033 * cos((2 * PI * J) / 365)

//       示例数据:
//
//     */
//     const dr =
//     this._COMPUTED_CENTER_PARAMS_.earth_sun_distance_inverse = dr;

//     /*
//       太阳磁偏角

//       公式: 0.409 * sin((2 * PI * J / 365) - 1.39)

//       示例数据:
//       J = 246 result = 0.409
//     */
//     const delta = mul(bn(0.409), sin(sub(
//       div(
//         mul(bn(2), bn(Math.PI), bn(this.J)),
//         bn(365)
//       ),
//       bn(1.39)
//     )));
//     this._COMPUTED_CENTER_PARAMS_.solar_magnetic_declination = delta;

//     /*
//       日落时角

//       公式: acos(-tan(rad) * tan(delta))

//       示例数据
//       rad = -0.35 delta = 0.409 result = 1.527
//     */
//     const ws = acos(mul(
//       mul(bn(-1), tan(rad)),
//       tan(delta)
//     ));
//     this._COMPUTED_CENTER_PARAMS_.sunset_angle = ws;

//     /*
//       天顶辐射

//       公式:

//       示例数据
//

//       注意:
//     */

//     this._COMPUTED_CENTER_PARAMS_.zenith_radiation = Ra;

//     /*
//       白昼时间

//       公式:

//       示例数据:
//
//     */
//     const N = div(mul(bn(24), ws), bn(Math.PI));
//     this._COMPUTED_CENTER_PARAMS_.daytime_duration = N;

//     /*
//       太阳辐射或太阳短波辐射

//       公式: (as + bs * (n / N)) * Ra

//       示例数据
//       as = 0.25 bs = 0.5 n = 7.1 N = 10.9 Ra = 25.1  result = 14.45
//     */
//     const Rs = mul(
//       add(
//         bn(this.As),
//         mul(bn(this.Bs), div(bn(this.n), bn(N)))
//       ),
//       bn(Ra)
//     );
//     this._COMPUTED_CENTER_PARAMS_.solar_shortwave_radiation = Rs;

//     /*
//       晴空太阳辐射

//       公式:

//       示例数据:
//       (1) As = 0.25 Bs = 0.5 Ra = 32.2 result =
//       (2) height = result =

//       注意:
//       01 当 n=N 时,计算晴天太阳辐射(Rso) 需要计算净长波辐射在接近海平面
//     */
//     const Rso = this.As && this.Bs ?
//       mul(add(this.As, this.Bs), Ra) :
//       mul(Ra, add(
//         bn(0.75),
//         mul(pow(210 , -5), bn(this.height))
//       )
//     )
//     this._COMPUTED_CENTER_PARAMS_.clear_sky_solar_radiation = Rso;

//     /*
//       净长波辐射

//       公式:
//       Rnl_R1 = ((Tmax + 272.15) ^ 4 + (Tmin + 272.15) ^ 4) / 4
//       Rnl_R2 = 0.34 - 0.14 * sqrt(ea)
//       Rnl_R3 = 1.35 * (Rs / Rso) - 0.35
//       Rnl = sigma * Rnl_R1 * Rnl_R2 * Rnl_R3

//       示例数据:
//       TMax = 25.1 TMin = 19.1 ea = 2.1 sigma = 4.903e-9 Rs = 14.5 Rso = 18.8 result = 3.5

//       示例数据: TMax 为 24小时内最高温度, TMin 为 24小时内最低温度
//     */
//     const Rnl_R1 = mul(bn(this.sigma), div(
//       add(
//         pow(add(this.TMax, bn(273.16)), bn(4)),
//         pow(add(this.TMin, bn(273.16)), bn(4))
//       ),
//       bn(2)
//     ));
//     const Rnl_R2 = sub(
//       bn(0.34),
//       mul(
//         bn(0.14),
//         sqrt(this.ea())
//       )
//     );
//     const Rnl_R3 = sub(
//       mul(
//         bn(1.35),
//         div(Rs, Rso)
//       ),
//       bn(0.35)
//     );
//     const Rnl = mul(Rnl_R1, Rnl_R2, Rnl_R3);
//     this._COMPUTED_CENTER_PARAMS_.net_longwave_radiation = Rnl;

//     /*
//       净太阳辐射或净短波辐射

//       公式: Rns = (1 - alpha) * Rs
//     */
//     const Rns = mul(sub(bn(1), bn(this.alpha)), Rs);
//     this._COMPUTED_CENTER_PARAMS_.net_shortwave_radiation = Rns;

//     const _value = Rns - Rnl
//     this._COMPUTED_CENTER_PARAMS_.net_radiation_from_crop_surfaces = _value;
//     return _value;
//   }

//   /*
//     土壤热通量

//     公式: 看可知的数据情况

//     注意:
//     01 对1天和10天的时段 约等于0
//     02 如果知道前一个月平均温度和后一个月的平均温度就是 0.07(T1 - T2)
//     03 如果后一个月平均温度不知道 0.14(T1 - T2)
//   */
//   G() {
//     let _value = bn(0.00000001)
//     if(!(this.TLMMean && this.TMMean && this.TPMMean)) _value = bn(0.00000001);
//     else if(this.TMMean && this.TLMMean) _value = mul(bn(0.14), sub(this.TMMean, this.TLMMean));
//     else if(this.TPMMean && this.TLMMean) _value = mul(bn(0.07), sub(this.TPMMean, this.TLMMean));
//     this._COMPUTED_CENTER_PARAMS_.soil_heat_flux = _value;
//     return _value;
//   }

//   /*
//     2m 处风速
//   */
//   u2() {
//     let _value = this.us2 !== undefined || null ? this.us2 : div(
//       mul(bn(this.uz[1]), bn(4.87)),
//       log(sub(mul(bn(67.82), bn(this.uz[0])), bn(5.42)))
//     );
//     this._COMPUTED_CENTER_PARAMS_.wind_speed_2 = _value;
//     return _value;
//   }

//   // 参照腾发量
//   et0() {
//     const result1 = mul(bn(0.408), bn(this.alphaP()), sub(bn(this.Rn()), bn(this.G())))
//     const result2 = mul(this.gama(), div(bn(900), add(this.TMean, bn(273))));
//     const result3 = mul(bn(this.u2()), sub(this.es(), this.ea()));
//     const result4 = add(
//       this.alphaP(),
//       mul(
//         this.gama(),
//         add(
//           bn(1),
//           mul(bn(0.34), bn(this.u2()))
//         )
//       )
//     );

//     const _value = div(add(result1, mul(result2, result3)), result4);
//     this._COMPUTED_CENTER_PARAMS_.reference_evapotranspiration = _value;
//     return _value;
//   }

//   done() {
//     return this.et0();
//   }

//   params() {
//     return this._COMPUTED_CENTER_PARAMS_;
//   }
// }
