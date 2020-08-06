# wAct - Woke Actor System

wAct is a wrapper around [Nact](https://github.com/ncthbrt/nact) that provides
message and actor structure conventions, common actor behaviour (like
state machines), and supervision policies.

The actor model is useful in the functional paradigm as it clearly
relegates all state mutations to the edge of the domain logic. Nact is
a compact message-oriented middleware which facilitates message based communication
between isolated entities called actors.

All credit to [Nick Cuthbert](https://github.com/ncthbrt) for the core of this
package.

#### Where to start?

Core specification of the Woke Actor System is contained in `src/actor-system.js`.

## Actor Lifecycle

Messages to an actor are stored in a FIFO queue and operated on sequentially.

Actors execute a target function only upon receipt of a message. Upon conclusion,
stateful actors may mutate their own encapsulated state which will be fed to the
target function on its next execution.

_NB_ Some rules which are not enforced by the library must be followed to
maintain the reactive and side-effect resistant characteristics of actors.
For example, messages should not contain functions which reference the state of
another actor.

## Rationale

Decoupled modules are easy to change. _Temporal decoupling_ is difficult.

Actors break the modules of an application into a set of microservices that
are able to make clear promises to other parts of the system and manage fatal
errors within their own bounded fault context.

> Services offer a clear contract with respect to their interface and errors.

**For example**, a transaction management service might promise to ensure the
transaction is processed by a remote system, managing any network availability
issues, thus requiring the caller to have less knowledge of the transaction system
and minimise its failure modes - it may only need to be aware of errors with the
transaction's arguments.

This helps achieve fault tolerance, particularly when some components of the
system have many or random failure modes. It also clearly delineates
error handling from the domain logic, separating control flow into two coexistent
architectures:

1. **Domain**: Message oriented services - _Flat structure_
2. **Fault management**: Supervision tree - _Hierarchical structure_

In other words, the system does its job by passing messages among
several encapsulated modules, and manages failure by structuring these modules
into a top-down tree of execution contexts in which each node may defer to its
parent to make decisions about faults.

By confining faults to a supervision context it becomes much easier to model and
manage failure scenarios. Read more at [The Reactive
Manifesto](https://www.reactivemanifesto.org/).

- Redux on the server
- Objects with concurrency
- 'Let it crash' philosophy
