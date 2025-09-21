use std::collections::HashSet;

use super::*;

#[derive(Debug, Clone, Hash, PartialEq, Eq)]
struct Person {
    name: String,
    age: u16,
}

impl AutoMapped for Person {
    type Key = String;

    fn key(&self) -> &Self::Key {
        &self.name
    }
}

/// A struct just to ensure that the proper traits are defined
#[derive(Default, Debug, PartialEq, Eq)]
struct Outer(AutoHashMap<Person>);

#[test]
fn auto_hashmap() {
    let mut hashmap = AutoHashMap::<Person>::new();
    let bob1 = Person {
        name: "Bob".into(),
        age: 23,
    };
    let bob2 = Person {
        name: "Bob".into(),
        age: 41,
    };
    let ruth = Person {
        name: "Ruth".into(),
        age: 32,
    };
    assert_eq!(hashmap.insert(bob1.clone()), None);
    assert_eq!(hashmap.insert(ruth.clone()), None);
    assert_eq!(hashmap.insert(bob2.clone()), Some(bob1.clone()));
    assert_eq!(
        hashmap.values().collect::<HashSet<&Person>>(),
        vec![&bob2, &ruth].into_iter().collect()
    );
    assert_eq!(hashmap.len(), 2);
    assert_eq!(hashmap.get("Bob"), Some(&bob2));
    assert_eq!(hashmap.remove("Bob"), Some(bob2));
    assert_eq!(hashmap.remove("Ruth"), Some(ruth));
}

#[test]
fn auto_btreemap() {
    let mut hashmap = AutoBTreeMap::<Person>::new();
    let bob1 = Person {
        name: "Bob".into(),
        age: 23,
    };
    let bob2 = Person {
        name: "Bob".into(),
        age: 41,
    };
    let ruth = Person {
        name: "Ruth".into(),
        age: 32,
    };
    assert_eq!(hashmap.insert(bob1.clone()), None);
    assert_eq!(hashmap.insert(ruth.clone()), None);
    assert_eq!(hashmap.insert(bob2.clone()), Some(bob1.clone()));
    assert_eq!(
        hashmap.values().collect::<HashSet<&Person>>(),
        vec![&bob2, &ruth].into_iter().collect()
    );
    assert_eq!(hashmap.len(), 2);
    assert_eq!(hashmap.get("Bob"), Some(&bob2));
    assert_eq!(hashmap.remove("Bob"), Some(bob2));
    assert_eq!(hashmap.remove("Ruth"), Some(ruth));
}
