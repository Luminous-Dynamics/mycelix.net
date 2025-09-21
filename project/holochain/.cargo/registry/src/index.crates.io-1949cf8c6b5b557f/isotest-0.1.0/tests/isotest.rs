use futures::FutureExt;
use isotest::IsotestContext;

trait Common {
    fn num(&self) -> u8;
}

/// A struct representing real production data
#[derive(Clone, Debug, PartialEq, Eq, derive_more::Add, derive_more::Sum)]
struct RealStruct(u8, u8);

/// A struct representing a subset of the production data
#[derive(Clone, Debug, PartialEq, Eq, derive_more::Add, derive_more::Sum)]
struct TestStruct(u8);

isotest::iso! {
    TestStruct => |a| { RealStruct(a.0, 0) },
    RealStruct => |b| { TestStruct(b.0) },

    test_cases: [
        TestStruct(0),
        TestStruct(42),
    ],
    real_cases: [
        RealStruct(0, 42),
        RealStruct(42, 0),
    ],
}

/// Another subset representation of production data, but with a bad Common trait implementation
#[derive(Copy, Clone, Debug, PartialEq, Eq, derive_more::Add, derive_more::Sum)]
struct BadTestStruct(u8);

isotest::iso! {
    BadTestStruct => |a| { RealStruct(a.0, 0) },
    RealStruct => |b| { BadTestStruct(b.0) },

    test_cases: [
        BadTestStruct(0),
        BadTestStruct(42),
    ],
    real_cases: [
        RealStruct(0, 0),
        RealStruct(42, 0),
    ],
}

/// Another subset representation of production data, but with a bad Iso trait implementation
#[derive(Copy, Clone, Debug, PartialEq, Eq, derive_more::Add, derive_more::Sum)]
struct BadderTestStruct(u8);

// This is an intentionally faulty implementation!
isotest::iso! {
    BadderTestStruct => |a| { RealStruct(a.0, 0) },
    RealStruct => |b| { BadderTestStruct(b.0 + 1) },

    // Note: no test cases will pass for this implementation.
}

impl Common for RealStruct {
    fn num(&self) -> u8 {
        self.0
    }
}

impl Common for TestStruct {
    fn num(&self) -> u8 {
        self.0
    }
}

// This is an intentionally faulty implementation!
impl Common for BadTestStruct {
    fn num(&self) -> u8 {
        self.0 + 1
    }
}

impl Common for BadderTestStruct {
    fn num(&self) -> u8 {
        self.0
    }
}

fn process<T: Common, I: Iterator<Item = T>>(ts: I) -> u8 {
    ts.map(|t| Common::num(&t)).sum()
}

#[test]
fn test_invariants() {
    use isotest::*;
    assert_iso_invariants_test(TestStruct(42));
    assert_iso_invariants_test(BadTestStruct(42));
    assert_iso_invariants_real::<TestStruct, _>(RealStruct(101, 222));

    assert_panic::assert_panic! {
        assert_iso_invariants_test(BadderTestStruct(42)),
        String,
        contains "test -> real -> test roundtrip should leave original value unchanged"
    };
    assert_panic::assert_panic! {
        assert_iso_invariants_real::<BadderTestStruct, _>(RealStruct(101, 222)),
        String,
        contains "real -> test -> real -> test roundtrip should be idempotent"
    };
}

#[test]
fn basic() {
    isotest::isotest!(TestStruct => |iso| {
        let x = iso.create(TestStruct(1));
        let y = iso.create(TestStruct(2));
        let mut z = iso.create(TestStruct(3));
        assert_eq!(process([x.clone(), y.clone(), z.clone()].into_iter()), 6);

        let y = iso.update(y, |mut y| {
            y.0 = 4;
            y
        });
        assert_eq!(process([x.clone(), y.clone(), z.clone()].into_iter()), 8);

        iso.mutate(&mut z, |z| {
            z.0 = 10;
        });
        assert_eq!(process([x, y, z].into_iter()), 15);
    });
}

/// Test that an incorrect trait implementation leads to a different test outcome.
///
/// A real test should not check the context.
#[test]
fn big_fails() {
    isotest::isotest!(BadTestStruct =>|iso| {
        let x = iso.create(BadTestStruct(1));
        let y = iso.create(BadTestStruct(2));
        let z = iso.create(BadTestStruct(3));

        match iso.context() {
            IsotestContext::Test => {
                assert_eq!(process([x.clone(), y.clone(), z.clone()].into_iter()), 9)
            }
            IsotestContext::Real => {
                assert_eq!(process([x.clone(), y.clone(), z.clone()].into_iter()), 6)
            }
        }

        let y = iso.update(y, |mut y| {
            y.0 = 4;
            y
        });

        match iso.context() {
            IsotestContext::Test => {
                assert_eq!(process([x.clone(), y.clone(), z.clone()].into_iter()), 11)
            }
            IsotestContext::Real => {
                assert_eq!(process([x.clone(), y.clone(), z.clone()].into_iter()), 8)
            }
        }
    });
}

#[test]
fn multi_iso() {
    isotest::isotest!(TestStruct, BadTestStruct => |good, bad| {
        let mut g = good.create(TestStruct(0));
        let mut b = bad.create(BadTestStruct(0));

        good.mutate(&mut g, |g| g.0 += 1);
        bad.mutate(&mut b, |b| b.0 += 1);

        assert_eq!(g.0, 1);
        assert_eq!(b.0, 1);
    });
}

#[test]
fn async_support() {
    async fn f() -> u8 {
        1
    }

    smol::block_on(async {
        isotest::isotest_async!(TestStruct => |iso| async move {
            let x = iso.create(TestStruct(1));
            assert_eq!(f().await, x.0);
        }
        .boxed());
    })
}
