import {EventEmitter2} from 'eventemitter2';
import {Configurable} from '../util/config/configurable';
import {EventEmitterConfiguration} from './configuration';
import {v4} from 'uuid';
import {Identifiable} from '../util/identifiable';
import {Managed} from '../util/managed';
import {AddressInfo, createConnection, createServer, Server, Socket} from 'net';
import {
  createStompClientSession,
  createStompServerSession,
  StompClientSessionLayer,
  StompError,
  StompHeaders,
  StompServerCommandListener,
  StompServerSessionLayer,
} from 'stomp-protocol';

interface ExchangeResponse {
  data: any;
  ok: boolean;
}

/**
 * Class used for communication between nodes. Since nodes can be on different hosts,
 * is necessary to use STOMP for communication.
 * This class is based on {@href https://github.com/jkyberneees/distributed-eventemitter}.
 * I recreated the same class here so I can adapt better for my needs.
 */
export class DistributedEventEmitter extends EventEmitter2
  implements
    Configurable<EventEmitterConfiguration>,
    Identifiable,
    Managed<DistributedEventEmitter> {
  readonly _configuration: EventEmitterConfiguration;
  private readonly _id: symbol;
  private readonly sock: Server;
  private client?: StompClientSessionLayer;
  private server?: StompServerSessionLayer;
  private started: boolean;
  constructor(configuration?: EventEmitterConfiguration) {
    super({
      wildcard: true,
      newListener: true,
    });
    this._id = Symbol(v4());
    this.started = false;
    this._configuration = DistributedEventEmitter.mountConfiguration(
      configuration
    );
    this.sock = createServer(socket => {
      this.generateServer(socket)
        .then(() => console.log('server connected'))
        .catch(() => console.error('error connecting server'));
    });
  }

  private static mountConfiguration(
    configuration?: EventEmitterConfiguration
  ): EventEmitterConfiguration {
    const conf = configuration || ({} as EventEmitterConfiguration);
    conf.server = configuration?.server || {
      host: '0.0.0.0',
      port: 7029,
      resetDisconnect: false,
      connectHeaders: {
        'heart-beat': '5000,5000',
        'accept-version': '1.0',
        host: '',
        login: '',
        passcode: '',
      },
    };
    conf.reconnect = configuration?.reconnect || {maxReconnects: 10};
    conf.destination = configuration?.destination || 'ds-em';
    conf.ignore = configuration?.ignore || [
      'newListener',
      'removeListener',
      'connected',
      'error',
      'connecting',
      'disconnected',
      'request',
      'response',
    ];
    return conf;
  }

  private static deserialize<T>(buffer: string | undefined): T {
    if (!buffer) {
      return {} as T;
    }
    try {
      let data = JSON.parse(buffer);
      if (1 === Object.keys(data).length) {
        data = data.d;
      } else {
        delete data['_sender'];
        delete data['message_uuid'];
        delete data['origin_message_uuid'];
      }
      return data;
    } catch (e) {
      return {} as T;
    }
  }

  private static serialize<T>(value?: T): string {
    return JSON.stringify({
      d: value || [],
    });
  }

  private generateClient(port: number): Promise<void> {
    // When created a new distributed event emitter, some events must be common to all nodes
    // Be notified when a new listener joins
    this.on('newListener', event => {
      if (this._configuration.ignore.indexOf(event) < 0) {
        if (this.listeners(event).length === 0) {
          let comparison = ` = '${event}'`;
          if (event.indexOf('*') >= 0) {
            comparison = ` LIKE '${event.replace(/\*/g, '%')}'`;
          }
          const topic = {
            destination: `/topic/${this._configuration.destination}`,
            selector: `event ${comparison} AND sender <> '${this.name().toString()}'`,
            ack: 'auto',
          };
          this.client!.subscribe(topic).then(() => {
            console.log('subscribe to', topic);
          });

          const queue = {
            destination: `/queue/${this._configuration.destination}`,
            selector: `event ${comparison} AND sender <> '${this.name().toString()}'`,
            ack: 'auto',
          };
          this.client!.subscribe(queue).then(() => {
            console.log('subscribe to', queue);
          });
        }
      }
    });

    // Be notified when a listener leaves
    this.on('removeListener', (event, _listener) => {
      if (this._configuration.ignore.indexOf(event) < 0) {
        if (this.listeners(event).length === 0) {
          // TODO: handle member removal
        }
      }
    });

    const connected = (headers: StompHeaders): void => {
      console.log('new client connected', headers);
      const destination = {
        id: this.name().toString(),
        destination: `/queue/${this._configuration.destination}`,
        ack: 'auto',
        selector: `target = '${this.name().toString()}'`,
      };
      this.client!.subscribe(destination).then(() => {
        console.log('subscribe successfully');
      });
    };
    const disconnected = () => {
      console.log('client disconnected');
      this.emit('removeListener', this.name().toString());
    };
    const listener: StompServerCommandListener = {
      connected,
      message(headers: StompHeaders, body?: string): void {
        console.log('server listener message', headers, body);
      },
      receipt(headers: StompHeaders): void {
        console.log('receipt', headers);
      },
      error(headers: StompHeaders, body?: string): void {
        console.log('client error', headers, body);
      },
      onProtocolError(error: StompError): void {
        console.log('client protocol error', error);
      },
      onEnd: disconnected,
    };
    const clientSocket = createConnection(
      port,
      this._configuration.server!.host
    );
    this.client = createStompClientSession(clientSocket, listener);
    return this.client.connect(this._configuration.server!.connectHeaders);
  }

  private generateServer(socket: Socket): Promise<void> {
    const connect = (headers: StompHeaders): void => {
      this.emit('connected', this.name().toString());
      this.started = true;
    };
    const send = (headers: StompHeaders, body?: string) => {
      console.log('Send!', body, headers);
      this.server!.message(headers, body);
    };

    const listener = {
      connect,
      send,
      subscribe(headers: StompHeaders) {
        console.log('subscription done to ' + (headers && headers.destination));
      },
      unsubscribe(headers: StompHeaders) {
        console.log('unsubscribe', headers);
      },
      begin(headers: StompHeaders) {
        console.log('begin', headers);
      },
      commit(headers: StompHeaders) {
        console.log('commit', headers);
      },
      abort(headers: StompHeaders) {
        console.log('abort', headers);
      },
      ack(headers: StompHeaders) {
        console.log('ack', headers);
      },
      nack(headers: StompHeaders) {
        console.log('nack', headers);
      },
      disconnect(headers: StompHeaders) {
        console.log('Disconnect!', headers);
      },
      onProtocolError(error: StompError) {
        console.log('Protocol error!', error);
      },
      onEnd() {
        console.log('End!');
      },
    };
    this.server = createStompServerSession(socket, listener);
    return this.server.connected(this._configuration.server!.connectHeaders);
  }

  unicast(event: any, data: any): Promise<ExchangeResponse> {
    return new Promise<any>((resolve, reject) => {
      const resolveProxy = (response: any) => {
        const obj = {
          data: response,
          ok: true,
        };
        this.emit('response', event, obj);
        resolve(obj);
      };

      const rejectProxy = (response: any) => {
        const obj = {
          data: response,
          ok: false,
        };
        this.emit('response', event, obj);
        reject(obj);
      };

      const listeners = this.listeners(event);
      if (listeners.length) {
        setImmediate(() => {
          try {
            // TODO: emit to instance
          } catch (e) {
            rejectProxy(e.message);
          }
        });
      }
    });
  }

  configuration(): EventEmitterConfiguration {
    return this._configuration;
  }

  name(): symbol {
    return this._id;
  }

  emit(event: string | string[], ...values: any[]): boolean {
    if (this._configuration.ignore.indexOf(event.toString()) < 0) {
      const headers = {
        'message-id': this.name().toString(),
        event: event.toString(),
        destination: `/topic/${this._configuration.destination}`,
        sender: this.name().toString(),
        priority: '9',
      };
      const data = DistributedEventEmitter.serialize(values);
      this.client!.send(headers, data)
        .then(value => {
          console.log('emitted', value);
        })
        .catch(err => {
          console.log(err);
        });
    }
    return false;
  }

  start(): Promise<DistributedEventEmitter> {
    if (this.started) {
      return Promise.resolve(this);
    }

    return new Promise<DistributedEventEmitter>((resolve, reject) => {
      this.sock.on('listening', () => {
        const {port} = this.sock.address() as AddressInfo;
        this.generateClient(port)
          .then(() => resolve(this))
          .catch(err => reject(err));
      });
      this.sock.on('error', err => {
        console.log('Failed connecting');
        reject(err);
      });
      const {host, port} = this._configuration.server!;
      this.sock.listen(port, host);
    });
  }

  isRunning(): boolean {
    return this.started;
  }

  stop(): Promise<void> {
    if (this.started) {
      return new Promise<void>((resolve, reject) => {
        this.sock.close(err => {
          if (err) {
            reject(err);
          } else {
            console.log('disconnected server');
            resolve(undefined);
          }
        });
      });
    }
    return Promise.resolve(undefined);
  }
}
