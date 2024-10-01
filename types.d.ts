import { BigNumber, MathType } from "mathjs";
import FAOModelMapping from "./FAOModelMapping";

export type atmosphereOptions = {
  /*
    name:       每天的最高气温
    isRequired: true
    example:    18.5 -> 18.5℃
  */
  temMax: number;

  /*
    name:       每天的最低气温
    isRequired: true
    example:    18.5 -> 18.5℃
  */
  temMin: number;

  /*
    name:       前一个月的平均气温
    isRequired: true
    example:    18.5 -> 18.5℃
  */
  avgTemPrevMonth?: number;

  /*
    name:       这个月的平均气温
    isRequired: true
    example:    18.5 -> 18.5℃
  */
  avgTemCurrMonth?: number;

  /*
    name:       去年中这个月的后一个月得平均温度
    isRequired: true
    example:    18.5 -> 18.5℃
    other:      比如今年为2024年6月, 那么就需要2023年的5月的数据
  */
  avgTemNextMonth?: number;

  /*
    name:       站点大气压强
    isRequired: false
    example:    18.5 -> 18.5kpa
    other:      如果存在即可直接使用, 如果没有可以使用站点海拔高度计算
  */
  stationPres?: number;

  /*
    name:       站点纬度
    isRequired: true
    example:    23.658656 -> xx°xx'
  */
  latitude: number;

  /*
    name:       海拔高度
    isRequired: true
    example:    13 -> 13m
  */
  height: number;

  /*
    name:       相对湿度最大值
    isRequired: true
    example:    0.56 -> 56%
  */
  rhMax: number;

  /*
    name:       相对湿度最小值
    isRequired: true
    example:    0.56 -> 56%
  */
  rhMin: number;

  /*
    name:       实际日照持续时间
    isRequired: true
    example:    13 -> 13hour
  */
  actualSunTime: number;

  /*
    name:       2米高度处的风速
    isRequired: true
    example:    2 -> 2m/s
  */
  windSpeedAt2m: number;

  /*
    name:       x米高度处的风速
    isRequired: false
    example:    [10, 1.2] -> 10米高风速为1.2m/s
  */
  windSpeedAtxm?: number[];

  /*
    name:       as / bs
    isRequired: false
    example:    0.25 / 0.5
  */
  as?: number;
  bs?: number;

  /*
    name:       反射率或冠层反射系数
    isRequired: false
    example:    0.23
    other:      以草为假想的参考作物时，α值为0.23（无量纲）
  */
  alpha?: number;

  /*
    name:       时间戳
    isRequired: false
    example:    156156165156
    other:      用于计算日序值, 如果不传入就使用当前值
  */
  timestamp?: number;
};

export type FAOContext = {
  /*
    name:       是否为南北半球
    isRequired: false
    example:    true
    other:      该单位影响弧度计算, 这里默认为北半球来做计算
  */
  isNorthern: boolean;

  /*
    name:       计算模式
    isRequired: false
    example:    1 -> 1day
    other:      标记当前得计算模式, 默认为: 以天为单位得计算模式
  */
  mode: "day" | "hour";

  /*
    name:       太阳常数
    isRequired: false
    example:    0.082 MJm^-2min^-1
  */
  Gsc: number;

  /*
    name:       Stefan-Boltzmann常数
    isRequired: false
    example:    4.903e-9 MJK^-4m^-2day^-1
  */
  sigma: number;

  /*
    name:       as / bs
    isRequired: false
    example:    0.25 / 0.5
  */
  as: number;
  bs: number;

  /*
    name:       反射率或冠层反射系数
    isRequired: false
    example:    0.23
    other:      以草为假想的参考作物时，α值为0.23（无量纲）
  */
  alpha: number;

  /*
    name:       此次FAO计算使用的气象数据
    isRequired: false
    example:    { ... } 参考 atmosphereOptions 内部参数
  */
  atmosphereOptions: number;

  /*
    name:       FAO计算所需的映射关系
    isRequired: true
    example:    { ... } 参考 FAOModelMapping 内部参数
  */
  fao: FAOModelMapping;

  // 数据缓存
  cacheData: Map<string, CacheDataValueType>;

  // mathjs 实例
  math: MathJsInstance;

  // 监测是否为字符串
  isString: (data: any) => boolean;

  // 监测是否为数字
  isNumber: (data: any) => boolean;

  // 计算两个数字的平均值
  getAverage: (value1: number, value2: number) => string;

  // 开始执行该映射key计算
  executeFAOMapping: (faoObj: FaoMappingType, ...args: any[]) => any;
};

export type CacheDataValueType = {
  // key值
  key: string;

  // 名称
  name: string;

  // 单位
  unit: string;

  // 值
  value: BigNumber | MathType | number | string;
};

export type FaoMappingType = {
  // key值
  key: string;

  // 名称
  name: string;

  // 单位
  unit: string;

  // 计算函数
  fn: any;
};
