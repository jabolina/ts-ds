import {EventEmitter} from 'events';
import {Configuration} from './configuration';
import {v4} from 'uuid';
import Connection from './connection';
import {createServer} from 'net';
import Message from './message';

export default class Communication extends EventEmitter {
  private readonly options: Configuration;
  private _connection?: Connection;
  readonly id: string;

  constructor(options?: Configuration) {
    super();
    this.options = options || {};

    if (!this.options.id) {
      this.options.id = v4();
    }
    this.id = this.options.id;
  }

  private connection(): Connection {
    if (!this._connection) {
      this._connection = new Connection(this.options, this);
    }
    return this._connection;
  }

  dispatch(name: string, ...args: any): boolean {
    EventEmitter.prototype.emit.apply(this, args);
    return this.listeners(name).length > 0;
  }

  listen(): Promise<Connection> {
    if (this._connection && this._connection.state.isOpen()) {
      return Promise.resolve(this._connection);
    }
    return new Promise<Connection>(resolve => {
      const connection = this.connection();
      const server = createServer(socket => {
        connection.accept(socket);
      });
      const {port, host} = connection.options;
      server.listen(port!, host!, () => {
        connection.bind(server);
        resolve(connection);
      });
    });
  }

  connect(): Promise<Connection> {
    if (this._connection && this._connection.state.isOpen()) {
      return Promise.resolve(this._connection);
    }
    return this.connection().connect();
  }

  disconnect(): Promise<void> {
    if (!this._connection || this._connection.state.isClosed()) {
      return Promise.resolve();
    }
    this._connection.close();
    return Promise.resolve();
  }

  send(message: Message<unknown>) {
    return this.connect().then(connection => connection.send(message));
  }
}
