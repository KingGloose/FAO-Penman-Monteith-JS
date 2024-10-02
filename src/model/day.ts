import { ConfigOptions } from "mathjs";
import baseFAO from "./base";
import FAOModelMapping from "../map/faoMap";
import type { atmosphereOptions } from "../types";

// 计算每日得模型值
// 添加参数是否缓存该值

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

    return super.executeFAOMapping(this.fao.DAY_SEQUENCE_NUMBER)(timestamp);
  }

  // average_temperature 平均温度
  AverageTemperature(): number {
    const temMax = this.atmo?.temMax;
    const temMin = this.atmo?.temMin;

    return super.executeFAOMapping(this.fao.AVERAGE_TEMPERATURE)(temMax, temMin);
  }

  // station_atmospheric_pressure 站点大气压强
  StationAtmosphericPressure(): number {
    const height = this.atmo?.height;

    return super.executeFAOMapping(this.fao.STATION_ATMOSPHERIC_PRESSURE)(height);
  }

  // vapor_pressure_byt 空气温度T时的水汽压
  VaporPressureByt(tem: number = this.AverageTemperature()): number {
    return super.executeFAOMapping(this.fao.VAPOR_PRESSURE_BYT, false)(tem);
  }

  // radian_measure 根据纬度来计算弧度
  RadianMeasureByLat(): number {
    const latitude = this.atmo?.latitude;

    return super.executeFAOMapping(this.fao.RADIAN_MEASURE_BYLAT)(latitude);
  }

  // hygrometer_constant 湿度计常数
  HygrometerConstant(): number {
    let stationPres = this.atmo?.stationPres;
    if (!stationPres) stationPres = this.StationAtmosphericPressure();

    return super.executeFAOMapping(this.fao.HYGROMETER_CONSTANT)(stationPres);
  }

  // saturation_vapor_pressure 饱和水汽压
  SaturationVaporPressure(): number {
    const temMax = this.atmo?.temMax;
    const temMin = this.atmo?.temMin;

    return super.executeFAOMapping(this.fao.SATURATION_VAPOR_PRESSURE)(temMax, temMin);
  }

  // saturation_vapor_pressure_slope 饱和水汽压曲线斜率
  SatutationVaporPressureSlope(): number {
    const avgTem = this.AverageTemperature();

    return super.executeFAOMapping(this.fao.SATURATION_VAPOR_PRESSURE_SLOPE)(avgTem);
  }

  // actual_vapor_pressure 实际水汽压
  ActualVaporPressure(): number {
    const temMax = this.atmo?.temMax;
    const temMin = this.atmo?.temMin;
    const rhMax = this.atmo?.rhMax;
    const rhMin = this.atmo?.rhMin;

    return super.executeFAOMapping(this.fao.ACTUAL_VAPOR_PRESSURE)(temMax, temMin, rhMax, rhMin);
  }

  // earth_sun_distance_inverse 日地间相对距离的倒数
  EarthSunDistanceInverse(): number {
    const day = this.DaySequenceNumber();

    return super.executeFAOMapping(this.fao.EARTH_SUN_DISTANCE_INVERSE)(day);
  }

  // solar_magnetic_declination 太阳磁偏角
  SolarMagneticDeclination(): number {
    const day = this.DaySequenceNumber();

    return super.executeFAOMapping(this.fao.SOLAR_MAGNETIC_DECLINATION)(day);
  }

  // sunset_angle 日落时角
  SunsetAngle(): number {
    const rad = this.RadianMeasureByLat();
    const delta = this.SolarMagneticDeclination();

    return super.executeFAOMapping(this.fao.SUNSET_ANGLE)(rad, delta);
  }

  // zenith_radiation 天顶辐射
  ZenithRadiation(): number {
    const gsc = this.Gsc;
    const rad = this.RadianMeasureByLat();
    const delta = this.SolarMagneticDeclination();
    const ws = this.SunsetAngle();
    const dr = this.EarthSunDistanceInverse();

    return super.executeFAOMapping(this.fao.ZENITH_RADIATION)(gsc, rad, delta, ws, dr);
  }

  // daytime_duration 白昼时间
  DaytimeDuration(): number {
    const ws = this.SunsetAngle();

    return super.executeFAOMapping(this.fao.DAYTIME_DURATION)(ws);
  }

  // solar_shortwave_radiation 太阳辐射或太阳短波辐射
  SolarShortwaveRadiation(): number {
    const As = this.as;
    const Bs = this.bs;
    const N = this.DaytimeDuration();
    const n = this.atmo?.actualSunTime;
    const Ra = this.ZenithRadiation();

    return super.executeFAOMapping(this.fao.SOLAR_SHORTWAVE_RADIATION)(As, Bs, n, N, Ra);
  }

  // clear_sky_solar_radiation 晴空太阳辐射
  ClearSkySolarRadiation(): number {
    const height = this.atmo?.height;
    const ra = this.ZenithRadiation();

    return super.executeFAOMapping(this.fao.CLEAR_SKY_SOLAR_RADIATION)(ra, height);
  }

  // net_longwave_radiation 净长波辐射
  NetLongWaveRadiation(): number {
    const sigma = this.sigma;
    const temMax = this.atmo?.temMax;
    const temMin = this.atmo?.temMin;
    const ea = this.ActualVaporPressure();
    const rs = this.SolarShortwaveRadiation();
    const rso = this.ClearSkySolarRadiation();

    return super.executeFAOMapping(this.fao.NET_LONGWAVE_RADIATION)(sigma, temMax, temMin, ea, rs, rso);
  }

  // net_shortwave_radiation 净太阳辐射或净短波辐射
  NetShortWaveRadiation(): number {
    const alpha = this.alpha;
    const rs = this.SolarShortwaveRadiation();

    return super.executeFAOMapping(this.fao.NET_SHORTWAVE_RADIATION)(alpha, rs);
  }

  // net_radiation_from_crop_surfaces 作物表面的净辐射
  NetRadiationFormCropSurfaces(): number {
    const rns = this.NetShortWaveRadiation();
    const rnl = this.NetLongWaveRadiation();

    return super.executeFAOMapping(this.fao.NET_RADIATION_FROM_CROP_SURFACES)(rns, rnl);
  }

  // soil_heat_flux 土壤热通量
  SoilHeatFlux(): number {
    return super.executeFAOMapping(this.fao.SOIL_HEAT_FLUX)();
  }

  // wind_speed_xm_to_2m x米高度风速转为2米风速
  WindSpeedXmTo2m(): number {
    const windSpeedAtxm = this.atmo?.windSpeedAtxm;
    const windSpeedAt2m = this.atmo?.windSpeedAt2m;
    if (windSpeedAt2m) return windSpeedAt2m;

    return super.executeFAOMapping(this.fao.WIND_SPEED_XM_TO_2M)(windSpeedAtxm);
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

    return super.executeFAOMapping(this.fao.REFERENCE_EVAPOTRANSPIRATION)(alphaP, rn, g, gama, avgTem, u2, es, ea);
  }

  // 开始
  start() {
    return this.ReferenceEvapotranspiration();
  }

  // 获取中间值
  getCache() {
    return Array.from(this.cacheData).reduce<any>((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
  }
}

export default FAOPenmanMonteith;
