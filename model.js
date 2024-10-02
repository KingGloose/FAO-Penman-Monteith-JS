const { create, all } = require("mathjs")

const {
  add, // 加
  subtract: sub, // 减
  multiply: mul, // 乘
  divide: div, // 除
  bignumber: bn,
  pow,
  exp,
  cos,
  sin,
  acos,
  tan,
  sqrt,
  log,
} = create(all, {
  precision: 20,
});

// 此处计算的值以天为单位
class FAOPenmanMonteith {
  // 中间变量
  _COMPUTED_CENTER_PARAMS_ = {}; 

  constructor({ TMax, TMin, TPMMean, TMMean, TLMMean, height, p, us2, RHMax, RHMin, alt, timestamp, n, uz, As, Bs, alpha }) {
    // 每天的最高气温(℃) 示例数据: 20 -> 20℃
    this.TMax = TMax;

    // 每天的最低气温(℃) 示例数据: 20 -> 20℃
    this.TMin = TMin;

    // 2米高度处的今天平均气温(℃) 示例数据: 20 -> 20℃
    this.TMean = this.Get_TMean(this.TMax, this.TMin);

    // 前一个月的平均气温(℃) 示例数据: 20 -> 20℃
    this.TPMMean = TPMMean;

    // 这个月的平均气温(℃) 示例数据: 20 -> 20℃
    this.TMMean = TMMean;
    
    // 后一个月的平均气温(℃) 示例数据: 20 -> 20℃
    this.TLMMean = TLMMean;

    // 相对湿度最大值(%) 示例数据: 0.8 -> 80%
    this.RHMax = RHMax;
    
    // 相对湿度最小值(%) 示例数据: 0.8 -> 80%
    this.RHMin = RHMin;

    // 站点海拔(m) 示例数据: 20 -> 20m
    this.height = height;

    // 站点大气压强(kpa) 示例数据: 20 -> 20kpa
    this.p = p;

    // 站点纬度(xx°xx'的十进制)
    this.alt = alt; 

    // 日序值今天是今年的第几天
    this.J = this.Get_J(timestamp);

    // 实际日照持续时间 (hour) 示例数据: 20 -> 20小时
    this.n = n;

    // 2米高度处的风速(m/s)
    this.us2 = us2;

    // z米高度处的风速(m/s) -> 示例数据 [10, 8.37] 表示 10m 处风速 8.37m/s
    this.uz = uz;

    // 是否为南北半球 影响弧度的计算 这里默认为北半球
    this.isNorthern = true;

    // 太阳常数(MJm^-2min^-1)
    this.Gsc = 0.082;

    // 天顶辐射在晴天到达地球的部分
    this.As = As || 0.25;
    this.Bs = Bs || 0.5;

    // Stefan-Boltzmann常数 MJK^-4m^-2day^-1
    this.sigma = 4.903e-9;

    // 反射率或冠层反射系数，以草为假想的参考作物时，α值为0.23（无量纲）
    this.alpha = alpha || 0.23;
  }

  // ============================== 中间参数 ==============================
  /*
    计算日序数
  */ 
  Get_J(timestamp) {
    const date = new Date(timestamp);
    const date1 = new Date(date.getFullYear(), 0, 0).getTime();
    const diff = date.getTime() - date1;

    const _value = Math.floor(diff / (1000 * 60 * 60 * 24));
    this._COMPUTED_CENTER_PARAMS_.day_sequence_number = _value;
    return _value;
  }

  /*
    计算平均温度（℃）

    公式: (TMax + TMin) / 2
  */ 
  Get_TMean(TMax, TMin) {
    const _value = div(
      add(bn(TMax), bn(TMin)), 
      2
    );
    this._COMPUTED_CENTER_PARAMS_.average_temperature = _value;
    return _value
  }

  /*
    根据站点海拔计算大气压强（kpa）

    公式: 101.3 * ((1 - 0.0065 * height / 293) ^ 5.26)

    示例数据: 
    height = 20     result = 101.06381054996688762
    height = 1900   result = 81.755796407644209059

    注意: 该公式假设大气温度为 20℃ 的情况简化的理想气体定律计算
  */ 
  Get_P_ByHeight(height) {
    const _value = mul(
      bn(101.3), 
      pow(
        div(sub(bn(293), mul(bn(0.0065), bn(height))),bn(293)), 
        bn(5.26))
    );
    this._COMPUTED_CENTER_PARAMS_.atmospheric_pressure = _value
    return _value;
  }

  /*
    空气温度T时的水汽压

    公式: 0.6108 * exp((17.27 * T) / (T + 237.3))

    示例数据:
    T = 24.5     result = 3.075
    T = 15       result = 1.705
  */
  Get_E0(T) { 
    const _value = mul(
      bn(0.6108),
      exp(div(
        mul(bn(17.27), bn(T)), 
        add(bn(T), bn(237.3))
      ))
    );
    this._COMPUTED_CENTER_PARAMS_.vapor_pressure = _value;
    return _value;
  }

  /* 
    计算弧度
  */
  Get_Rad(alt) {
    const _value =  mul(
      div(bn(Math.PI), bn(180)), 
      bn(alt)
    );
    this._COMPUTED_CENTER_PARAMS_.radian_measure =_value;
    return _value;
  }

  // ============================== 最终参数 ==============================
  /*
    湿度计常数（kpa/℃）

    公式: 0.000665 * p

    示例数据:
    p = 81.8    result = 0.054

    注意
    01 这里用到了 汽化潜热(2.45 MJkg^-1) 常压下的比热(1.013*10^-3 MJkg^-1℃^-1) 水蒸汽分子量与干燥空气分子量的比(0.662)
    02 常压下的比热 / 水蒸汽分子量与干燥空气分子量的比 * 汽化潜热 = 0.665
  */ 
  gama() {
    // 没有 大气压强 就根据海拔高度来测算
    if (!this.p) this.p = this.Get_P_ByHeight(this.height);

    const _value = mul(bn(0.000665), bn(this.p));
    this._COMPUTED_CENTER_PARAMS_.hygrometer_constant = _value
    return _value;
  }

  /*
    饱和水汽压（kpa）

    公式:
    e0(T) = 0.6108 * exp((17.27 * T) / (T + 237.3))
    es = (e0(Tmax) + e0(Tmin)) / 2 
    
    示例数据:
    Tmax = 24.5 Tmin = 15 result = 2.3899976414986809294
  */
  es() {
    const _value = div(
      add(this.Get_E0(this.TMax), this.Get_E0(this.TMin)), 
      2
    );
    this._COMPUTED_CENTER_PARAMS_.saturation_vapor_pressure = _value
    return _value
  }

  /*
    饱和水汽压曲线斜率

    公式: (4098 * e0(T)) / (T + 237.3) ^ 2

    示例数据
    TMean = 25    result = 0.189
    TMean = 9.5   result = 0.080

    注意: alphaP 出现在分子和分母中，饱和水汽压曲线的斜率用平均气温计算
  */ 
  alphaP() {
    const _value = div(
      mul(bn(4098), this.Get_E0(this.TMean)), 
      pow(add(this.TMean, bn(237.3)), bn(2))
    );
    this._COMPUTED_CENTER_PARAMS_.saturation_vapor_pressure_slope = _value;
    return _value;
  }

  /*
    利用相对湿度数据计算实际水汽压(kpa)

    公式: ea = (e0(Tmin) * RHMin + e0(Tmax) * RHMax) / 2

    示例数据
    TMin = 18 TMax = 25 RHMax = 0.82 RHMin = 0.54 result = 1.70

    注意: 这里使用的是 最高 和 最低 的相对湿度来做计算的, 使用平均相对湿度会存在精度问题 
  */ 
  ea() {
    const _value = div(
      add(
        mul(this.Get_E0(this.TMin), bn(this.RHMax)),
        mul(this.Get_E0(this.TMax), bn(this.RHMin))
      ),
      bn(2)
    )
    this._COMPUTED_CENTER_PARAMS_.actual_vapor_pressure = _value;
    return _value;
  }

  /*
    作物表面的净辐射

    公式: Rns - Rnl
  */
  Rn() {
    /*
      弧度

      公式: (PI / 180) * alt

      示例数据
      alt: 20°S  result = -0.35
    */ 
    const rad = this.isNorthern ? this.Get_Rad(this.alt) : mul(bn(-1), this.Get_Rad(this.alt));

    /*
      日地间相对距离的倒数

      公式: 1 + 0.033 * cos((2 * PI * J) / 365)

      示例数据:
      J = 246 result = 0.985
    */ 
    const dr = add(bn(1), mul(
        bn(0.033), 
        cos(div(mul(bn(this.J), mul(bn(2), bn(Math.PI))), bn(365)))
      )
    );
    this._COMPUTED_CENTER_PARAMS_.earth_sun_distance_inverse = dr;

    /*
      太阳磁偏角

      公式: 0.409 * sin((2 * PI * J / 365) - 1.39)

      示例数据:
      J = 246 result = 0.409
    */ 
    const delta = mul(bn(0.409), sin(sub(
      div(
        mul(bn(2), bn(Math.PI), bn(this.J)),
        bn(365)
      ),
      bn(1.39)
    )));
    this._COMPUTED_CENTER_PARAMS_.solar_magnetic_declination = delta;

    /*
      日落时角

      公式: acos(-tan(rad) * tan(delta))

      示例数据
      rad = -0.35 delta = 0.409 result = 1.527
    */
    const ws = acos(mul(
      mul(bn(-1), tan(rad)), 
      tan(delta)
    ));
    this._COMPUTED_CENTER_PARAMS_.sunset_angle = ws;

    /*
      天顶辐射

      公式:
      resutl1 = 24 * 60 * Gsc * dr / PI
      result2 = ws * sin(rad) * sin(delat))
      result3 = cos(rad) * cos(delta) * sin(ws)
      result = result1 * result2 * result3

      示例数据
      rad = -0.35 delta = 0.409 ws = 1.527 Gsc = 0.0820   result = 32.2

      注意: 下述公式以天为单位计算
    */
    const Ra_R1 = div(
      mul(bn(24), bn(60), this.Gsc, dr),
      bn(Math.PI)
    )
    const Ra_R2 = mul(ws, sin(rad), sin(delta));
    const Ra_R3 = mul(cos(rad), cos(delta), sin(ws));
    const Ra = mul(Ra_R1, add(Ra_R2, Ra_R3));
    this._COMPUTED_CENTER_PARAMS_.zenith_radiation = Ra;

    /*
      白昼时间

      公式: N = 23 * ws / PI

      示例数据:
      ws = 1.527 result = 11.7
    */
    const N = div(mul(bn(24), ws), bn(Math.PI));
    this._COMPUTED_CENTER_PARAMS_.daytime_duration = N;

    /*
      太阳辐射或太阳短波辐射

      公式: (as + bs * (n / N)) * Ra

      示例数据
      as = 0.25 bs = 0.5 n = 7.1 N = 10.9 Ra = 25.1  result = 14.45
    */
    const Rs = mul(
      add(
        bn(this.As), 
        mul(bn(this.Bs), div(bn(this.n), bn(N)))
      ), 
      bn(Ra)
    );
    this._COMPUTED_CENTER_PARAMS_.solar_shortwave_radiation = Rs;

    /*
      晴空太阳辐射

      公式: 两种情况
      (1) Rso = (As + Bs) * Ra
      (2) Rso = (0.75 + 210 ^ -5 * height) * Ra

      示例数据:
      (1) As = 0.25 Bs = 0.5 Ra = 32.2 result = 
      (2) height = result = 

      注意:
      01 当 n=N 时,计算晴天太阳辐射(Rso) 需要计算净长波辐射在接近海平面
    */
    const Rso = this.As && this.Bs ? 
      mul(add(this.As, this.Bs), Ra) : 
      mul(Ra, add(
        bn(0.75), 
        mul(pow(210 , -5), bn(this.height))
      )
    )
    this._COMPUTED_CENTER_PARAMS_.clear_sky_solar_radiation = Rso;

    /*
      净长波辐射

      公式:
      Rnl_R1 = ((Tmax + 272.15) ^ 4 + (Tmin + 272.15) ^ 4) / 4
      Rnl_R2 = 0.34 - 0.14 * sqrt(ea)
      Rnl_R3 = 1.35 * (Rs / Rso) - 0.35
      Rnl = sigma * Rnl_R1 * Rnl_R2 * Rnl_R3

      示例数据:
      TMax = 25.1 TMin = 19.1 ea = 2.1 sigma = 4.903e-9 Rs = 14.5 Rso = 18.8 result = 3.5


      示例数据: TMax 为 24小时内最高温度, TMin 为 24小时内最低温度
    */
    const Rnl_R1 = mul(bn(this.sigma), div(
      add(
        pow(add(this.TMax, bn(273.16)), bn(4)), 
        pow(add(this.TMin, bn(273.16)), bn(4))
      ), 
      bn(2)
    ));
    const Rnl_R2 = sub(
      bn(0.34), 
      mul(
        bn(0.14), 
        sqrt(this.ea())
      )
    );
    const Rnl_R3 = sub(
      mul(
        bn(1.35), 
        div(Rs, Rso)
      ), 
      bn(0.35)
    );
    const Rnl = mul(Rnl_R1, Rnl_R2, Rnl_R3);
    this._COMPUTED_CENTER_PARAMS_.net_longwave_radiation = Rnl;

    /*
      净太阳辐射或净短波辐射

      公式: Rns = (1 - alpha) * Rs
    */
    const Rns = mul(sub(bn(1), bn(this.alpha)), Rs);
    this._COMPUTED_CENTER_PARAMS_.net_shortwave_radiation = Rns;

    const _value = Rns - Rnl
    this._COMPUTED_CENTER_PARAMS_.net_radiation_from_crop_surfaces = _value;
    return _value;
  }

  /*
    土壤热通量

    公式: 看可知的数据情况

    注意:
    01 对1天和10天的时段 约等于0
    02 如果知道前一个月平均温度和后一个月的平均温度就是 0.07(T1 - T2)
    03 如果后一个月平均温度不知道 0.14(T1 - T2)
  */ 
  G() {
    let _value = bn(0.00000001)
    if(!(this.TLMMean && this.TMMean && this.TPMMean)) _value = bn(0.00000001);
    else if(this.TMMean && this.TLMMean) _value = mul(bn(0.14), sub(this.TMMean, this.TLMMean));
    else if(this.TPMMean && this.TLMMean) _value = mul(bn(0.07), sub(this.TPMMean, this.TLMMean));
    this._COMPUTED_CENTER_PARAMS_.soil_heat_flux = _value;
    return _value;
  }

  /*
    2m 处风速
  */ 
  u2() {
    let _value = this.us2 !== undefined || null ? this.us2 : div(
      mul(bn(this.uz[1]), bn(4.87)), 
      log(sub(mul(bn(67.82), bn(this.uz[0])), bn(5.42)))
    );
    this._COMPUTED_CENTER_PARAMS_.wind_speed_2 = _value;
    return _value;
  }

  // 参照腾发量
  et0() {
    const result1 = mul(bn(0.408), bn(this.alphaP()), sub(bn(this.Rn()), bn(this.G())))
    const result2 = mul(this.gama(), div(bn(900), add(this.TMean, bn(273))));
    const result3 = mul(bn(this.u2()), sub(this.es(), this.ea()));
    const result4 = add(
      this.alphaP(), 
      mul(
        this.gama(), 
        add(
          bn(1), 
          mul(bn(0.34), bn(this.u2()))
        )
      )
    );

    const _value = div(add(result1, mul(result2, result3)), result4);
    this._COMPUTED_CENTER_PARAMS_.reference_evapotranspiration = _value;
    return _value;
  }

  done() {
    return this.et0();
  }

  params() {
    return this._COMPUTED_CENTER_PARAMS_;
  }
}

// example
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

console.log(f)


module.exports = FAOPenmanMonteith;