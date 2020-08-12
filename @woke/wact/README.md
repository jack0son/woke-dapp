# wAct - Woke Actor System

wAct is a wrapper around [Nact](https://github.com/ncthbrt/nact) that provides
message and actor structure, common actor behaviour (like state machines), and
supervision policies.

Nact is a compact message-oriented middleware which facilitates message based
communication between isolated entities called actors. An actor model is useful
in the functional paradigm as it relegates all state mutations to the edge of
the domain logic by using a sequential execution lifecycle within each actor.

Actors protect against concurrency problems caused by shared state and
side-effects.

- Failure isolation
- State encapsulation
- Reduced coupling
- Recovery-oriented computing

All credit to [Nick Cuthbert](https://github.com/ncthbrt) for the core of this
package.

#### Where to start?

Core specification of the Woke Actor System is contained in `src/actor-system.js`.

## Actor Lifecycle

Messages to an actor are stored in a FIFO queue and operated on sequentially.

Actors execute a target function only upon receipt of a message. Stateful actors
may mutate their own encapsulated state by returning the new state which will be
fed to the target function on its next execution. Deterministic behaviour using
function composition is achieved naturally within the target function - similar
to a redux reducer.

**NB** Some rules which are not enforced by the library must be followed to
maintain the reactive and side-effect resistant characteristics of actors. For
example, messages should not contain functions which reference the state of
another actor.

## Rationale

Decoupled modules are easy to change. _Temporal decoupling_ is difficult.

Actors break the modules of an application into a set of microservices that
are able to make clear promises to other parts of the system and manage fatal
errors within their own bounded fault context.

> Services offer a clear contract with respect to their interface and errors.

**For example**, a transaction management service might promise to ensure the
transaction is processed by a remote system, managing any network availability
issues, thus requiring the caller to have less knowledge of the transaction
system and minimise its failure modes - it may only need to be aware of errors
with the transaction's arguments, and avoids exposure to any system crash
encountered by the service.

This helps achieve fault tolerance, particularly when some components of the
system have many or random failure modes - perhaps an unreliable data source or
buggy dependency. It also clearly delineates error handling from the domain
logic, separating control flow into two coexistent architectures:

1. **Domain**: Message oriented services - _Flat structure_
2. **Fault management**: Supervision tree - _Hierarchical structure_

In other words, the system _*does its job*_ by passing messages among several
encapsulated modules, and _*manages failure*_ by structuring these modules into
a tree of execution contexts in which each node may defer to its parent to make
decisions about faults (supervision policy).

Supervision policies can be easily shared between different services for common
failure patterns such as API rate-limits or excessive runtime.

By confining faults (fault localisation) to a supervision context it becomes
much easier to model and manage failure scenarios. System intent is also clearer
as domain logic is less interleaved with error handling. Read more at [The
Reactive Manifesto](https://www.reactivemanifesto.org/).

**Notes**

- [Let it
  crash](http://stratus3d.com/blog/2020/01/20/applying-the-let-it-crash-philosophy-outside-erlang/#:~:text=Let%20it%20crash%20is%20a%20fault%20tolerant%20design%20pattern.&text=That's%20a%20good%2C%20terse%2C%20description,program%20ought%20to%20handle%20them.)
  philosophy
- Message-based thread communication / similar to Communicating Sequential
  Processes
- Redux on the server
- Object concurrency model
