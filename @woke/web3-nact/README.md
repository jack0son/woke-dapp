# 📬 web3-act

**Just send it** ✔️

Web3 as a service with self healing subscriptions and transactions. Easily spin
up a web3 backend without worrying about transaction juggling, provider
failures, or subscription reliability.

Run me as service, or start me from your dApp back end. When I start a fire,
I'll set it 🔥 at a safe distance from your backend.

- Self healing subscriptions (events, blockheaders)
- Intelligent transaction submission (indempotence, gas calculation, nonce and
  address pool management)
- Provider redundancy (provide a list of fall-through providers)
- Isolate frequent web3 faults from the rest of your application
- Built-in monitoring with sentry or twitter DMs

**Why?**

When interacting with the Ethereum blockchain there is a broad set of failure
modes across transaction management, network connection, and event
subscriptions. Web3 itself has also been known for arbitrary failures caused by
bugs.

Web3-act uses a recovery-oriented approach to masking failures, only reporting
back to the service caller when the fault is irresolvable or due to an invalid
parameter.

Allows you to separate the domain logic of your web3 service, such as an oracle,
market maker, analytics backend etc., from web3 boiler plate and failures so you
can focus more on behaviour and less on reliability.

It also implements useful preset algorithms for transaction preflight processes
like gas estimation, and nonce and address pool management, which can easily be
substituted or optimized for your use case.

- Cleanly decouple web3 provider management/supervision from blockchain interactions.
- Supervision policies with various levels of fault reporting granularity.
- Easily plug in your own supervision policies and preflight logic.

### How do I send a transaction?

## Under the hood

Web3-act uses an actor model (built with [wact](https://jack0son/wact)) to
address the recurring concurrency and reliability issues encountered with
complex web3 services, and isolate their failures into separate
execution contexts.

The core is a web3 provider actor as the gateway coordinator through which all other
components interact with the ethereum blockchain. The core ensures connection
availability and synchronises distribution of transaction nonces. Basically
a glorified semaphore.

1. Coordinate transaction nonces and provider connections
2. Isolate provider failures from transaction failures

Use web3-act to build a microservice

Web3-act gives you a number of fault tolerance and address

## Fault Tolerance

### Provider Redundancy

### Subscription Keep-alive

## Transactions

Address pool / nonce management

- Transaction failures / retry
- Gas Policy
- Transaction cost management
- Transaction Replacement
- Transactions treated as indempotent

## Contracts
