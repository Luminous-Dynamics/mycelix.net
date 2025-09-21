# automap

Simple pattern to implement key-value maps where the value type contains the key type.
Implementations for `HashMap` and `BTreeMap` from `std::collections` are provided.

## Example

```rust
use std::collections::HashMap;
use automap::{AutoHashMap, AutoMapped};

// Let's say we want a `Person` to be keyed by their `name` in a HashMap
#[derive(Debug, Clone, Hash, PartialEq, Eq)]
struct Person {
    name: String,
    age: u16,
}

// We can specify how to derive the key from the value
// As long as the Key type meets the bounds for a normal HashMap key, we
// can use this value in an AutoHashMap.
// (Similarly for BTreeMap.)
impl AutoMapped for Person {
    type Key = String;

    fn key(&self) -> &Self::Key {
        &self.name
    }
}

// Then, we can simply use an `AutoHashMap` to insert values directly.
let mut map = AutoHashMap::new();
let michelle = Person { name: "Michelle".into(), age: 37 };
// We don't need to provide the key, because it is derived from the value.
map.insert(michelle.clone());

// You can access all other normal HashMap methods directly:
assert_eq!(map.get("Michelle".into()), Some(&michelle));
assert_eq!(map.remove("Michelle".into()), Some(michelle));

// We can also go From and Into a normal HashMap easily.
let inner: HashMap<_, _> = map.into();
let map: AutoHashMap<_> = inner.into();
```

## Serde support

Set the `"serde"` feature in your dependencies to include de/serialization support.

## Future improvements

- Avoid cloning the key: ideally, the key would be borrowed from the value, but it wasn't immediately apparent how to do this while still providing serde deserialization. Perhaps a bespoke data structure could be written instead of leaning on `std::collections`.
    - This could also be implemented with a proc macro which splits the target struct into the key part and the remainder, so that the key is only stored once while still using a standard Map.
- Allow a value type to have multiple `Automapped` implementations, specifying different keys for different situations
