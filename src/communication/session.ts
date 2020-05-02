import {EventEmitter} from 'events';
import Connection from './connection';
import Outgoing from './outgoing';
import Sender from './sender';
import {v4} from 'uuid';
import {Frame} from './frame';

export default class Session extends EventEmitter {
  readonly connection: Connection;
  readonly observers: EventEmitter;
  readonly outgoing: Outgoing;

  constructor(connection: Connection) {
    super();
    this.connection = connection;
    this.outgoing = new Outgoing(connection);
    this.observers = new EventEmitter();
  }

  begin(): void {}

  send(sender: Sender, tag: Buffer, payload: Frame): void {
    this.outgoing.send(sender, tag, payload);
  }

  dispatch(name: string, ...args: any) {
    EventEmitter.prototype.emit.apply(this.observers, args);
    if (this.listeners(name).length) {
      EventEmitter.prototype.emit.apply(this, args);
      return true;
    }
    return this.connection.dispatch.apply(this, args);
  }

  sender() {
    return new Sender(this, v4());
  }
}
