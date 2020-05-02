# ts-ds
Some distributed system protocols, using Atomix as reference.

Some libraries will be "recreated" here, meaning I will get only the parts I need and
change it to meet the needs. Some references:

Communication based on the [rhea](https://github.com/amqp/rhea). Since I dont need the complete AMQP protocol
and did not need the TLS support, I did some changes to remove the protocol specific parts, leaving it to 
use only the raw [Net](https://nodejs.org/api/net.html).

Since we need a distributed application, the event nodes will be based on the [EventEmitter](https://nodejs.org/api/events.html),
but to work for multiple hosts/processes, is needed a distributed event emitter, so I did some adaptations based on the
[distributed-eventemitter](https://github.com/jkyberneees/distributed-eventemitter). Striping the STOMP and using
only TCP.
