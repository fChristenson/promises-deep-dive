const util = require("util");

describe("Promise tests", () => {
  it("can return a resolved promise", done => {
    Promise.resolve().then(done);
  });

  it("can return a rejected promise", done => {
    Promise.reject().catch(done);
  });

  it("can return a resolved promise with async/await", async () => {
    const actual = await Promise.resolve().then(() => {
      return 1;
    });

    const expected = 1;
    expect(actual).toEqual(expected);
  });

  it("can return a rejected promise with async/await", async () => {
    const actual = await Promise.reject().catch(() => {
      return 1;
    });

    const expected = 1;
    expect(actual).toEqual(expected);
  });

  it("can return a resolved promise in a promise", async () => {
    const actual = await Promise.resolve().then(() => {
      return Promise.resolve(1);
    });

    const expected = 1;
    expect(actual).toEqual(expected);
  });

  it("can return a valid promise in a failed promise", async () => {
    const actual = await Promise.reject().catch(() => {
      return Promise.resolve(1);
    });

    const expected = 1;
    expect(actual).toEqual(expected);
  });

  it("is not a great thing to make a promise hell", async () => {
    const val = await Promise.resolve(1).then(a => {
      return Promise.resolve(1).then(b => {
        return Promise.resolve(1).then(c => {
          // we are getting a code belly
          return a + b + c;
        });
      });
    });

    const expected = 3;
    const actual = val;
    expect(actual).toEqual(expected);
  });

  it("is better if you chain", async () => {
    const val = await Promise.resolve(1)
      .then(val => val + 1)
      .then(val => val + 1);

    const expected = 3;
    const actual = val;
    expect(actual).toEqual(expected);
  });

  it("shows that the promise is a pipe of transforms or steps", async () => {
    const actual = await Promise.resolve(1)
      .then(val => {
        return { foo: val }; // step 1
      })
      .then(obj => {
        return { foo: obj.foo + 1 }; // step 2
      })
      .then(obj => {
        return { bar: obj.foo + 1 }; // step 3
      })
      .then(obj => obj.bar) // step 4
      .then(val => String(val)) // step 5
      .then(val => parseInt(val)) // step 6
      .then(val => {
        let count = 0;
        for (let i = 0; i < val; i++) {
          count = count + 1;
        }
        return count; // step 7
      });

    const expected = 3;
    expect(actual).toEqual(expected);
  });

  it("shows that a promise is very close to what map does", async () => {
    const actual = [1]
      .map(val => {
        return { foo: val };
      })
      .map(obj => {
        return { foo: obj.foo + 1 };
      })
      .map(obj => {
        return { bar: obj.foo + 1 };
      })
      .map(obj => obj.bar)
      .map(val => String(val))
      .map(val => parseInt(val))
      .map(val => {
        let count = 0;
        for (let i = 0; i < val; i++) {
          count = count + 1;
        }
        return count;
      })
      .reduce((acc, val) => acc + val, 0);

    const expected = 3;
    expect(actual).toEqual(expected);
  });

  it("shows that you can use one promise to make new promises", async () => {
    const promiseOne = Promise.resolve(1);
    const promiseTwo = await promiseOne.then(val => val + 1);
    const promiseThree = await promiseOne.then(val => val + 2);

    expect(promiseTwo).toEqual(2);
    expect(promiseThree).toEqual(3);
  });

  it("if you reject a promise it skips to the closest catch", async () => {
    const promiseOne = Promise.reject(1);
    const promiseTwo = await promiseOne
      .then(val => val + 1) // skip
      .then(val => val + 1) // skip
      .then(val => val + 1) // skip
      .catch(val => val);
    const promiseThree = await promiseOne.catch(val => val + 2);

    expect(promiseTwo).toEqual(1);
    expect(promiseThree).toEqual(3);
  });

  it("if you reject a promise you can recover in the catch", async () => {
    const promiseOne = Promise.reject(1);
    const promiseTwo = await promiseOne
      .then(val => val + 1) // skip
      .catch(val => val)
      .then(val => val + 1); // we keep going

    expect(promiseTwo).toEqual(2);
  });

  it("it can get a bit crazy", async () => {
    const promiseOne = Promise.reject(1);
    const promiseTwo = await promiseOne
      .then(val => val + 1) // skip
      .catch(val => val)
      .then(val => val + 1) // we keep going
      .then(val => Promise.reject(val)) // again!?
      .catch(val => val);

    // try to avoid multiple catches if you can, it gets crazy after a while
    // make code simple as often as possible
    expect(promiseTwo).toEqual(2);
  });

  it("Has an old school callback function", done => {
    function waitForIt(time, callback) {
      return setTimeout(callback(1), time);
    }

    waitForIt(0, val => {
      const expected = 1;
      expect(val).toEqual(expected);
      done();
    });
  });

  it("Use the promise constructor to make a callback function promise based", async () => {
    function waitForIt(time) {
      return new Promise((resolve, reject) => {
        setTimeout(resolve(1), time);
      });
    }

    const val = await waitForIt(0);
    const expected = 1;
    expect(val).toEqual(expected);
  });

  it("works with reject as well", async () => {
    function waitForIt(time) {
      return new Promise((resolve, reject) => {
        setTimeout(reject(1), time);
      });
    }

    try {
      const val = await waitForIt(0);
      throw new Error("Fail"); // this should not run
    } catch (val) {
      const expected = 1;
      expect(val).toEqual(expected);
    }
  });

  it("old school rejection (its not you, its me)", done => {
    function waitForIt(time) {
      return new Promise((resolve, reject) => {
        setTimeout(reject(1), time);
      });
    }

    const val = waitForIt(0).catch(val => {
      const expected = 1;
      expect(val).toEqual(expected);
      done();
    });
  });

  it("nests promise constructors", done => {
    // don't do this
    function waitForIt(time) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const promise = new Promise(res => {
            return res(1);
          });

          return resolve(promise);
        }, time);
      });
    }

    const val = waitForIt(0).then(val => {
      const expected = 1;
      expect(val).toEqual(expected);
      done();
    });
  });

  it("remembers the chain", done => {
    // don't do this
    function waitForIt(time) {
      const promise = new Promise((resolve, reject) => {
        setTimeout(() => {
          return resolve(1);
        }, time);
      });

      return promise.then(val => val + 1); // we add 1
    }

    const val = waitForIt(0).then(val => {
      const expected = 2; // 1 + 1 = 2
      expect(val).toEqual(expected);
      done();
    });
  });

  it("can promisify", done => {
    function waitForIt(val, callback) {
      setTimeout(() => {
        return callback(null, val);
      }, 0);
    }

    // we convert a callback style function to a promise based one
    // this only works for functions that end with a function
    // that uss the (err, val) convention
    const promiseMe = util.promisify(waitForIt);
    promiseMe(1)
      .then(val => {
        const expected = 1;
        expect(val).toEqual(expected);
      })
      .then(done);
  });

  it("can promisify with async/await", async () => {
    function waitForIt(val, callback) {
      setTimeout(() => {
        return callback(null, val);
      }, 0);
    }

    const promiseMe = util.promisify(waitForIt);
    const val = await promiseMe(1);
    const expected = 1;
    expect(val).toEqual(expected);
  });

  it("can promisify with async/await and handle an error", async () => {
    function waitForIt(val, callback) {
      setTimeout(() => {
        // the promise is rejected if there is a first value passed to the function
        return callback(val, val);
      }, 0);
    }

    const promiseMe = util.promisify(waitForIt);

    try {
      const val = await promiseMe(1);
      throw new Error("Fail"); // this never runs
    } catch (val) {
      const expected = 1;
      expect(val).toEqual(expected);
    }
  });

  it("is not a good idea to handle error inside a function", async () => {
    function myFailingFunction() {
      return Promise.reject(1).catch(val => val); // only if we really have to
    }

    // the caller has now lost control of what happens with the error
    // what if we are logging things?
    // it is very common that code logs double or tripple when you do this
    const actual = await myFailingFunction();
    const expected = 1;
    expect(actual).toEqual(expected);
  });

  it("lets the caller decide what to do with the rejection", async () => {
    function myFailingFunction() {
      return Promise.reject(1); // no internal catching as a rule
    }

    try {
      await myFailingFunction();
      throw new Error("Fail");
    } catch (val) {
      const expected = 1;
      expect(val).toEqual(expected);
    }
  });

  it("can resolve all promises", async () => {
    const promiseOne = Promise.resolve(1);
    const promiseTwo = Promise.resolve(1);
    const promises = [promiseOne, promiseTwo];
    const expected = 2;
    const actual = await Promise.all(promises).then(vals => vals[0] + vals[1]);
    expect(actual).toEqual(expected);
  });

  it("will fail if one of the promises fail", async () => {
    const promiseOne = Promise.resolve(1);
    const promiseTwo = Promise.reject(1);
    const promises = [promiseOne, promiseTwo];
    const expected = 1;
    const actual = await Promise.all(promises).catch(val => val);
    expect(actual).toEqual(expected);
  });

  it("can be nice to unwrap the promises", async () => {
    const promiseOne = Promise.resolve(1);
    const promiseTwo = Promise.resolve(1);
    const promises = [promiseOne, promiseTwo];
    const resolvedPromises = await Promise.all(promises);
    const [a, b] = resolvedPromises;

    expect(a).toEqual(1);
    expect(b).toEqual(1);
  });

  it("can be nice to get what was resolved even with failures", async () => {
    const promiseOne = Promise.resolve(1);
    const promiseTwo = Promise.reject(1);
    const promises = [promiseOne, promiseTwo];
    const values = [];

    for (const promise of promises) {
      try {
        const val = await promise;
        values.push(val);
      } catch (e) {}
    }

    expect(values.length).toEqual(1);
    expect(values[0]).toEqual(1);
  });

  it("can race promises against each other", async () => {
    const promiseOne = Promise.resolve(1); // wins because it is first
    const promiseTwo = Promise.resolve(2); // loses because it is last
    const promises = [promiseOne, promiseTwo];
    const val = await Promise.race(promises);

    // this can be nice if you only need one of the results
    // as quickly as you can get them
    expect(val).toEqual(1);
  });

  it("proves that a race ends if anything fails", async () => {
    const promiseOne = Promise.reject(1); // wins because it is first
    const promiseTwo = Promise.resolve(2); // loses because it is last
    const promises = [promiseOne, promiseTwo];
    const val = await Promise.race(promises).catch(val => val);

    expect(val).toEqual(1);
  });

  it("can be nice to get the first resolved value even with failures", async () => {
    const promiseOne = Promise.reject(1);
    const promiseTwo = Promise.reject(1);
    const promiseThree = Promise.resolve(2);
    const promises = [promiseOne, promiseTwo, promiseThree];
    const values = [];

    for (const promise of promises) {
      try {
        if (values.length === 1) break;
        const val = await promise;
        values.push(val);
      } catch (e) {}
    }

    expect(values.length).toEqual(1);

    const [a] = values;
    expect(a).toEqual(2);
  });
});
