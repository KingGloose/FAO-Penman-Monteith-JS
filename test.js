// class Person {
//   f() {
//     console.log(this);
//     this.prototype.fn = function () {
//       console.log(12);
//     };
//   }
// }

// const p = new Person();
// p.f();
// p.fn();

function fn(f1, f2) {
  console.log(this.name, f1, f2);
}

function fn1(...args) {
  fn.call({ name: "zjh" }, ...args);
}
fn1(1, 2);
