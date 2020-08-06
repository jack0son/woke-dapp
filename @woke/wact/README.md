# wAct - Woke Actor System

Core definition of the Woke Actor System is contained in `src/actor-system.js`.

The actor model is helpful when working in a functional paradigm as it clearly
relegates all state mutatations to the edge of the domain logic. Nact is a
message-oriented middleware which provides communication between isolated
entities called actors.

wAct is a wrapper around [Nact](https://github.com/ncthbrt/nact) providing
conventions for message and actor structure, common actor behaviour (like
state machines), and supervision policies.

## Actor Lifecycle

Messages to an actor are stored in a FIFO queue and operated on sequentially.

Actors execute a target function only upon receipt of a message. Upon conculsion,
stateful actors may mutate their own encapsulated state which will be fed to the
target function on its next execution.

NB: Some rules not enforced by the library that must be followed to maintain the
reactive and side-effect resistant characterstics intended. For example,
messages should not contain functions which reference the state of another actor.

## Rationale

Decoupled modules are easy to change. Temporal decoupling is difficult.

Actors break the modules of an application into a set of microservices that
are able to make clear promises to other parts of the system and manage fatal
errors within their own bounded fault context.

Services offer a clear contract with respect to their interface and errors.

For example, a transaction management service might promise to ensure the
transaction is processed by a remote system, managing any network availability
issues, thus requiring the caller to have less knowledge of the transaction system
and minimise its failure modes - it may only need to be aware of errors with the
transaction's arguments.

This helps achieve fault tolerance, particularly when some components of the
system depend have many or random failure modes. It also clearly deliniates
error handling from the domain logic, seperating control flow into two coexistent
architectures:

1. Domain: Message oriented services - Flat structure
2. Supervision: Fault management - Hierarchical structure

In other words, the system does its job by passing messages among
several encapsulated modules, and manages failure by structuring these modules
into a top-down tree of execution contexts in which each node can defer to its
parent to make decisions about faults.

By confining faults to a supervision context it becomes much easier to model and
mange failure scenarios.

- Redux on the server
- Objects with concurrency
- 'Let it crash' philosophy
