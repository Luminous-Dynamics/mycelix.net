I want to write a generic algorithm exploring a tree with a function header similar to:

```
fn explore<Q, Item>(queue: &mut Q) where
 Q: Insert<Item> + Extract<Item>
{ ... }
```

The two traits defined as:

```
pub trait Insert<Item> {
  fn insert(&mut self, value: Item);
}

pub trait Extract<Item> {
  fn extract(&mut self) -> Option<Item>;
}
```

The ordering is abstracted away so I can call my algorithm with a stack, queue or even a priority queue if I want to. I can implement these two traits for `Vec` easily since it has only one ordering strategy: stack. However, for `VecDeque`, there is two possible implementation of these operations and of course, it does not make sense to choose one or the other.

It doesn't help to split the traits into several (one for each ordering strategies) since we want to abstract the ordering.

The solution I envisioned was to create a kind of adapter structure such as:

```
struct Stack<S, Order> where
  S: Pop<Order> + Push<Order>
{
  stack: S
}
```

Therefore, we would fix the ordering strategy of the underlying collection used (here we require `Pop` and `Push` to use the same ordering strategy. For example with `VecDeque` we have four possible implementations of `Extract` and `Insert` captured by the ordering used:

```
Stack<VecDeque<Item>, Front>;
Stack<VecDeque<Item>, Back>;
Queue<VecDeque<Item>, Front, Back>;
Queue<VecDeque<Item>, Back, Front>;
```

The good thing is that we can design a generic search algorithm over these sequences.