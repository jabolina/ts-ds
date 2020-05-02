import Session from './session';
import {EventEmitter} from 'events';
import Connection from './connection';
import Message from './message';

export default class Sender {
  private readonly observers: EventEmitter;
  private readonly connection: Connection;
  private readonly name: string;
  private tag: number;
  readonly session: Session;

  constructor(session: Session, name: string) {
    this.session = session;
    this.connection = session.connection;
    this.name = name;
    this.tag = 0;
    this.observers = new EventEmitter();
  }

  next(): Buffer {
    return Buffer.from((this.tag++).toString());
  }

  canSend(): boolean {
    return this.session.outgoing.available();
  }

  send(message: Message<unknown>) {
    const payload = message.encode();
    this.session.send(this, this.next(), payload);
    process.nextTick(() => this.session._process());
  }
}
