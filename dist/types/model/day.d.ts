import { ConfigOptions } from "mathjs";
import baseFAO from "./base";
import type { atmosphereOptions } from "../types";
declare class FAOPenmanMonteith extends baseFAO {
    private isNorthern;
    private mode;
    private Gsc;
    private sigma;
    as: number;
    bs: number;
    private alpha;
    atmo: atmosphereOptions | null;
    fao: {
        DAY_SEQUENCE_NUMBER: {
            key: string;
            name: string;
            unit: string;
            fn(ctx: import("../types").FAOContext, timestamp: number | string): number;
        };
        AVERAGE_TEMPERATURE: {
            key: string;
            name: string;
            unit: string;
            fn(ctx: import("../types").FAOContext, temMax: number, temMin: number): string;
        };
        STATION_ATMOSPHERIC_PRESSURE: {
            key: string;
            name: string;
            unit: string;
            fn(ctx: import("../types").FAOContext, height: number): import("mathjs").MathType;
        };
        VAPOR_PRESSURE_BYT: {
            key: string;
            name: string;
            unit: string;
            fn(ctx: import("../types").FAOContext, avgTem: number | string): any;
        };
        RADIAN_MEASURE_BYLAT: {
            key: string;
            name: string;
            unit: string;
            fn(ctx: import("../types").FAOContext, latitude: number | string): import("mathjs").MathType;
        };
        HYGROMETER_CONSTANT: {
            key: string;
            name: string;
            unit: string;
            fn(ctx: import("../types").FAOContext, stationPres: number): import("mathjs").MathType;
        };
        SATURATION_VAPOR_PRESSURE: {
            key: string;
            name: string;
            unit: string;
            fn(ctx: import("../types").FAOContext, temMax: number, temMin: number): number;
        };
        SATURATION_VAPOR_PRESSURE_SLOPE: {
            key: string;
            name: string;
            unit: string;
            fn(ctx: import("../types").FAOContext, avgTem: number): import("mathjs").MathType;
        };
        ACTUAL_VAPOR_PRESSURE: {
            key: string;
            name: string;
            unit: string;
            fn(ctx: import("../types").FAOContext, temMin: number, temMax: number, rhMin: number, rhMax: number): import("mathjs").MathType;
        };
        EARTH_SUN_DISTANCE_INVERSE: {
            key: string;
            name: string;
            unit: string;
            fn(ctx: import("../types").FAOContext, day: number): any;
        };
        SOLAR_MAGNETIC_DECLINATION: {
            key: string;
            name: string;
            unit: string;
            fn(ctx: import("../types").FAOContext, day: number): any;
        };
        SUNSET_ANGLE: {
            key: string;
            name: string;
            unit: string;
            fn(ctx: import("../types").FAOContext, rad: number, delta: number): any;
        };
        ZENITH_RADIATION: {
            key: string;
            name: string;
            unit: string;
            fn(ctx: import("../types").FAOContext, gsc: number, rad: number, delta: number, ws: number, dr: number): import("mathjs").MathType;
        };
        DAYTIME_DURATION: {
            key: string;
            name: string;
            unit: string;
            fn(ctx: import("../types").FAOContext, ws: number): any;
        };
        SOLAR_SHORTWAVE_RADIATION: {
            key: string;
            name: string;
            unit: string;
            fn(ctx: import("../types").FAOContext, As: number, Bs: number, n: number, N: number, Ra: number): import("mathjs").MathType;
        };
        CLEAR_SKY_SOLAR_RADIATION: {
            key: string;
            name: string;
            unit: string;
            fn(ctx: import("../types").FAOContext, Ra: number, height: number): import("mathjs").MathType;
        };
        NET_LONGWAVE_RADIATION: {
            key: string;
            name: string;
            unit: string;
            fn(ctx: import("../types").FAOContext, sigma: number, temMax: number, temMin: number, ea: number, rs: number, rso: number): import("mathjs").MathType;
        };
        NET_SHORTWAVE_RADIATION: {
            key: string;
            name: string;
            unit: string;
            fn(ctx: import("../types").FAOContext, alpha: number, Rs: number): import("mathjs").MathType;
        };
        NET_RADIATION_FROM_CROP_SURFACES: {
            key: string;
            name: string;
            unit: string;
            fn(ctx: import("../types").FAOContext, Rns: number, Rnl: number): any;
        };
        SOIL_HEAT_FLUX: {
            key: string;
            name: string;
            unit: string;
            fn(ctx: import("../types").FAOContext): any;
        };
        WIND_SPEED_XM_TO_2M: {
            key: string;
            name: string;
            unit: string;
            fn(ctx: import("../types").FAOContext, windSpeedAtxm: number[]): import("mathjs").MathType;
        };
        REFERENCE_EVAPOTRANSPIRATION: {
            key: string;
            name: string;
            unit: string;
            fn(ctx: import("../types").FAOContext, alphaP: number, rn: number, g: number, gama: number, avgTem: number, u2: number, es: number, ea: number): import("mathjs").MathType;
        };
    };
    constructor(atmosphereOptions: atmosphereOptions, mathOptions?: ConfigOptions);
    DaySequenceNumber(): number;
    AverageTemperature(): number;
    StationAtmosphericPressure(): number;
    VaporPressureByt(tem?: number): number;
    RadianMeasureByLat(): number;
    HygrometerConstant(): number;
    SaturationVaporPressure(): number;
    SatutationVaporPressureSlope(): number;
    ActualVaporPressure(): number;
    EarthSunDistanceInverse(): number;
    SolarMagneticDeclination(): number;
    SunsetAngle(): number;
    ZenithRadiation(): number;
    DaytimeDuration(): number;
    SolarShortwaveRadiation(): number;
    ClearSkySolarRadiation(): number;
    NetLongWaveRadiation(): number;
    NetShortWaveRadiation(): number;
    NetRadiationFormCropSurfaces(): number;
    SoilHeatFlux(): number;
    WindSpeedXmTo2m(): number;
    ReferenceEvapotranspiration(): number;
    start(): number;
    getCache(): any;
}
export default FAOPenmanMonteith;
