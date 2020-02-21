 Options for communication between tip monitor, tipper, and txManager
 1. Using queries:
      * source must manage request completion
      i.e. if queried actor times out then it is the source's responsibility
      to decide what to do with the unserviced message.

 2. Using blocking dispatch


 3. Using non-blocking dispatch


 4. Using persistence
      * sink becomes responsible for the message

  Dimensions of message oriented middleware
    - Asynchronous vs synchronous
    -  Transient vs persistent
    - Persisentent messages allow actors to be loosely couple in time

  Dimensions of coupling
    - referential decoupling: actors do not need to know each other
    explicitly
    - temporal deccoupling: actors do not need to be running at the same time

  Decision rules
    - when will actors be alive?
        - how often will an actor fail?

  Communication patterns
    - request-repy
    - publish-subscribe
    - pipeline

Side effect performance
   - track second and third order effects
   - rate of effects produced
