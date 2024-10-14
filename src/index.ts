import FAOPenmanMonteith from "./model/day";
export default FAOPenmanMonteith;

// example
// result: 3.9
// const f = new FAOPenmanMonteith(
//   {
//     temMax: 21.5,
//     temMin: 12.3,
//     rhMax: 0.84,
//     rhMin: 0.63,
//     height: 100,
//     latitude: 50.8,
//     windSpeedAtxm: [10, 2.78],
//     actualSunTime: 9.25,
//     // windSpeedAt2m: 2.078,
//   },
//   {
//     precision: 10,
//   }
// );
// console.log(f.start(), f.params());
