import { ConfigOptions, MathJsInstance } from "mathjs";
import { CacheDataValueType, FaoMappingType } from "../types";
declare class baseFAO {
    protected cacheData: Map<string, CacheDataValueType>;
    protected math: MathJsInstance;
    constructor(mathOptions: ConfigOptions);
    protected isString(data: any): data is string;
    protected isNumber(data: any): data is number;
    getAverage(value1: number, value2: number): string;
    executeFAOMapping(faoObj: FaoMappingType, isCache?: boolean): (...args: any[]) => any;
}
export default baseFAO;
