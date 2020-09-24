# 📬 web3-act

**Just send it**

Web3 as a service. Easily spin up a web3 backend without worrying about
transaction juggling, provider failures, or subscription reliability.

**Why?**

When interacting with the Ethereum blockchain there is a broad set of failure
modes across transaction management, network connection, and event
subscriptions. Web3 itself has also been known for arbitrary failures caused by
bugs.

Web3-act uses a recovery-oriented approach to masking failures, only reporting
back to the service caller when the fault is irresolvable or due to an invalid
parameter.

Allows you to separate the domain logic of your web3 service, such as an oracle,
market maker etc, from web3 boiler plate and web3 failures isolates failures so
you can focus on the availability ...

It also implements useful preset algorithms for transaction preflight processes
like gas estimation, and nonce and address pool management.

- Cleanly decouple web3 management from core logic - sending transactions,
  getting contract data, and
- Supervision policies with various levels of fault reporting granularity.
- Modularity allows you to easily plug in your own supervision policies and
  preflight logic

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

* Transactions treated as indempotent by default

## Contracts

Contract interface will appear similar to a web3 contract, but under-the-hood
method calls will send messages to the web3 coordinator service.
