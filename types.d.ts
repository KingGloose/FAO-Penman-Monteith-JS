import { BigNumber, MathJsInstance, MathType } from "mathjs";
import FAOModelMapping from "./FAOModelMapping";
import baseFAO from "./src/baseFAO";
import FAOPenmanMonteith from "./src/dayFAO";

type baseFAOType = typeof baseFAO;
type FAOPenmanMonteithType = typeof FAOPenmanMonteith;
export type FAOContext = InstanceType<baseFAOType> &
  InstanceType<FAOPenmanMonteithType> & {
    // mathjs 实例
    math: MathJsInstance;

    // 此次FAO计算使用的气象数据
    atmo: atmosphereOptions;

    // FAO计算所需的映射关系
    fao: FAOModelMapping;
  };

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
  windSpeedAt2m?: number;

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
