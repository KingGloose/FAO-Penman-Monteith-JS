import { create, all, ConfigOptions, MathJsInstance, isChain } from "mathjs";
import { CacheDataValueType, FaoMappingType } from "../../types";

class baseFAO {
  // 数据缓存
  protected cacheData = new Map<string, CacheDataValueType>();

  // mathjs 实例
  protected math: MathJsInstance;

  constructor(mathOptions: ConfigOptions) {
    // 创建 mathjs 实例
    this.math = create(all, {
      number: "BigNumber", // 默认使用 bignumber
      precision: 10,
      ...mathOptions,
    });
  }

  // 监测是否为字符串
  protected isString(data: any) {
    return typeof data === "string";
  }

  // 监测是否为数字
  protected isNumber(data: any) {
    return typeof data === "number";
  }

  // 计算两个数字的平均值
  public getAverage(value1: number, value2: number): string {
    if (!(this.isString(value1) || this.isNumber(value1))) {
      throw new Error("getAverage: value1 is not number or string");
    }
    if (!(this.isString(value2) || this.isNumber(value2))) {
      throw new Error("getAverage: value2 is not number or string");
    }

    return this.math.evaluate(`(${value1} + ${value2}) / 2`);
  }

  // 开始执行该映射key计算
  public executeFAOMapping(faoObj: FaoMappingType, isCache: boolean = true) {
    const _this = this; // 缓存外部 this

    return function (...args: any[]) {
      const { key, name, unit } = faoObj;

      // 01 查询是否存在该值
      if (_this.cacheData.has(key)) {
        return _this.cacheData.get(key)!.value;
      }

      // 02 执行计算
      const ctx = _this;
      const value = faoObj.fn.call(_this, ctx, ...args);

      // 03 执行缓存
      if (isCache) _this.cacheData.set(key, { key, name, unit, value });

      return value;
    };
  }
}

export default baseFAO;
