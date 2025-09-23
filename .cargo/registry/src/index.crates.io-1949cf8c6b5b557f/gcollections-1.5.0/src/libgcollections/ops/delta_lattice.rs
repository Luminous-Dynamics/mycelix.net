// Copyright 2018 Pierre Talbot (IRCAM)

// Licensed under the Apache License, Version 2.0 <LICENSE-APACHE or
// http://www.apache.org/licenses/LICENSE-2.0> or the MIT license
// <LICENSE-MIT or http://opensource.org/licenses/MIT>, at your
// option. This file may not be copied, modified, or distributed
// except according to those terms.

/// A delta lattice is a lattice with a delta operator which gives the difference between two elements.
/// The formal name of a delta lattice is a "weakly relative pseudo complemented lattice" (see Giacobazzi et al., Weak relative pseudo-complements of closure operators, 1995.)

pub trait Delta
{
  fn delta(&self, other: &Self) -> Self;
}

pub trait DeltaLattice:
   Lattice
 + Delta
{}

impl<R> DeltaLattice for R where
 R: Lattice,
 R: Delta,
{}

