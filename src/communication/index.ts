import {EventEmitter} from 'events';
import {Configuration} from './configuration';
import {v4} from 'uuid';
import Connection from './connection';
import {createServer} from 'net';

export default class Communication extends EventEmitter {
  private readonly options: Configuration;
  readonly id: string;

  constructor(options?: Configuration) {
    super();
    this.options = options || {};

    if (!this.options.id) {
      this.options.id = v4();
    }
    this.id = this.options.id;
  }

  dispatch(name: string, ...args: any): boolean {
    EventEmitter.prototype.emit.apply(this, args);
    return this.listeners(name).length > 0;
  }

  listen(): Promise<Connection> {
    return new Promise<Connection>(resolve => {
      const connection = new Connection(this.options, this);
      const server = createServer(socket => {
        connection.accept(socket);
      });
      const {port, host} = connection.options;
      server.listen(port!, host!, () => {
        connection.state.isServer(true);
        resolve(connection);
      });
    });
  }

  connect(): Promise<Connection> {
    return new Connection(this.options, this).connect();
  }
}
