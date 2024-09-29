import { BigNumber, MathType } from "mathjs";

export type MODEL_VALUE = BigNumber | number | string | MathType;

export type MODEL_MAP_VALUE = {
  key: string;
  name: string;
  value: MODEL_VALUE;
};
