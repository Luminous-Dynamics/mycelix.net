//! A simple pattern to implement maps where the value type also contains the key type.
//! Implementations for `HashMap` and `BTreeMap` from `std::collections` are provided.
//!
//! ```
//! use std::collections::HashMap;
//! use automap::{AutoHashMap, AutoMapped};
//!
//! // Let's say we want a `Person` to be keyed by their `name` in a HashMap
//! #[derive(Debug, Clone, Hash, PartialEq, Eq)]
//! struct Person {
//!     name: String,
//!     age: u16,
//! }
//!
//! // We can specify how to derive the key from the value
//! // As long as the Key type meets the bounds for a normal HashMap key, we
//! // can use this value in an AutoHashMap.
//! // (Similarly for BTreeMap.)
//! impl AutoMapped for Person {
//!     type Key = String;
//!
//!     fn key(&self) -> &Self::Key {
//!         &self.name
//!     }
//! }
//!
//! // Then, we can simply use an `AutoHashMap` to insert values directly.
//! let mut map = AutoHashMap::new();
//! let michelle = Person { name: "Michelle".into(), age: 37 };
//! map.insert(michelle.clone());
//!
//! // You can access all other normal HashMap methods directly:
//! assert_eq!(map.get("Michelle".into()), Some(&michelle));
//! assert_eq!(map.remove("Michelle".into()), Some(michelle));
//!
//! // We can also go From and Into a normal HashMap easily.
//! let inner: HashMap<_, _> = map.into();
//! let map: AutoHashMap<_> = inner.into();
//! ```

#![deny(missing_docs)]

#[cfg(test)]
mod tests;

/// Trait that describes how to extract a key out of a value
pub trait AutoMapped {
    /// The key type
    type Key;

    /// Accessor for the key
    fn key(&self) -> &Self::Key;
}

macro_rules! implementation {
    ($outer: ident, $inner: ident, $bounds: path) => {
        use std::collections::$inner;

        /// A map whose values also contain their keys
        #[derive(
            Debug,
            Clone,
            PartialEq,
            Eq,
            shrinkwraprs::Shrinkwrap,
            derive_more::From,
            derive_more::Into,
        )]
        #[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
        #[shrinkwrap(mutable, unsafe_ignore_visibility)]
        pub struct $outer<T: AutoMapped>($inner<T::Key, T>)
        where
            T::Key: $bounds;

        impl<T: AutoMapped> Default for $outer<T>
        where
            T::Key: $bounds,
        {
            fn default() -> Self {
                Self($inner::default())
            }
        }

        impl<T: AutoMapped> $outer<T>
        where
            T::Key: $bounds,
        {
            /// Constructor
            pub fn new() -> Self {
                Self($inner::new())
            }

            /// Insert a key-value pair via just the value
            pub fn insert(&mut self, val: T) -> Option<T> {
                self.0.insert(val.key().clone(), val)
            }

            /// Pass-through for inner `into_iter`
            pub fn into_iter(self) -> impl Iterator<Item = (T::Key, T)> {
                self.0.into_iter()
            }
        }
    };
}

// Implementations for both HashMap and BTreeMap are very similar
implementation!(AutoHashMap, HashMap, AutoHashMapKey);
implementation!(AutoBTreeMap, BTreeMap, AutoBTreeMapKey);

cfg_if::cfg_if! {
    if #[cfg(feature = "serde")] {
        /// The constraints on an AutoHashMap key
        pub trait AutoHashMapKey: serde::Serialize + serde::de::DeserializeOwned + Clone + std::hash::Hash + PartialEq + Eq {}
        impl<T> AutoHashMapKey for T where T: serde::Serialize + serde::de::DeserializeOwned + Clone + std::hash::Hash + PartialEq + Eq {}

        /// The constraints on an AutoBTreeMap key
        pub trait AutoBTreeMapKey: serde::Serialize + serde::de::DeserializeOwned + Clone + PartialOrd + Ord {}
        impl<T> AutoBTreeMapKey for T where T: serde::Serialize + serde::de::DeserializeOwned + Clone + PartialOrd + Ord {}
    } else {
        /// The constraints on an AutoHashMap key
        pub trait AutoHashMapKey: Clone + std::hash::Hash + PartialEq + Eq {}
        impl<T> AutoHashMapKey for T where T: Clone + std::hash::Hash + PartialEq + Eq {}

        /// The constraints on an AutoBTreeMap key
        pub trait AutoBTreeMapKey: Clone + PartialOrd + Ord {}
        impl<T> AutoBTreeMapKey for T where T: Clone + PartialOrd + Ord {}

    }
}
