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


## Modules

Each module for and a simple overview, if anything is interesting to mention here.

#### Communication

The communication is using the raw NodeJS socket implementation, to handle each frame correctly for parsing/deparsing
the structure used on write is:

    [(UInt 4)|(UInt 1)|(Bin*)] -> Frame
        A         B      C

Where the first offset, denoted by `A` will hold information about the size of the buffer, which means that 
`A = B.length + C.length`, this is used when de-parsing the data buffer. The field denoted by `B` is just a data offset
which will carry the value `2` and finally the field `C` holds the data.

When de-parsing the data, on each buffer must follows this pseudo code:

```text
on_receive(buffer):
    received = []
    while not buffer.is_empty:
        next = buffer.read_uint(width=4) // This will read the payload size and remove first 4 bytes
        complete_data = buffer.slice(next) // This will slice the received buffer from 0 up to {next}
        offset = complete_data.read_uint(width=1) // Sent data offset, must contain value 2. Will read and remove
        
        if offset != 2:
            throw Error('invalid frame')
        
        received.add(complete_data);
    return received
```

Following the pseudocode, will leave with an array of buffers containing only the sent data. On our implementation
dont contain any header transmission (yet).
