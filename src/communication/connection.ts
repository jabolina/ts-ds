import {Configuration, ReconnectConfiguration} from './configuration';
import Communication from './index';
import {join} from 'path';
import {homedir} from 'os';
import {cwd} from 'process';
import {existsSync, readFileSync} from 'fs';
import {v4} from 'uuid';
import Session from './session';
import {connect, createServer, Server, Socket} from 'net';
import Transport from './transport';
import {EventEmitter} from 'events';
import State from './state';
import Message from './message';
import Sender from './sender';

function sessionPerConnection(connection: Connection) {
  let session: Session | undefined = undefined;
  return function () {
    if (!session) {
      session = connection.createSession();
      session.observers.on('session_close', () => {
        session = undefined;
      });
      session.begin();
    }
    return session;
  };
}

export default class Connection extends EventEmitter {
  private readonly options: Configuration;
  private readonly container: Communication;
  private readonly transport: Transport;
  private readonly policy: () => Session;
  private server?: Server;
  private listener?: Socket;
  private state: State;
  private defaultSender?: Sender;
  writer?: Socket;
  private socketReady: boolean;
  private connectCounter: number;
  private previousInput?: Buffer;
  private boxedError?: Error;
  private abortIdle: boolean;
  private closedNonFatalError: boolean;
  private registered: boolean;
  private scheduledReconnect?: NodeJS.Timeout;
  private transportError?: Error;

  constructor(options: Configuration, container: Communication) {
    super();
    this.options = this.getDefaultConnectConfig(options);
    this.container = container;
    this.state = new State();
    this.transport = new Transport(this.options.id!, this.options.id!, this);
    this.policy = sessionPerConnection(this);
    this.socketReady = false;
    this.connectCounter = 0;
    this.abortIdle = false;
    this.registered = false;
    this.closedNonFatalError = true;
  }

  private initListener(listener: Socket) {
    this.listener = listener;
    this.listener.on('data', (data: unknown) => {
      if (Buffer.isBuffer(data)) {
        this.input(data);
      } else {
        console.log('not buffer data');
      }
    });
    this.listener.on('error', err => this.error(err));
    this.listener.on('end', () => {
      console.log('end');
    });
    return this;
  }

  private initWriter(writer: Socket) {
    this.writer = writer;
    this.writer.on('error', err => this.error(err));
    this.writer.on('end', () => {
      console.log('writer end');
    });
  }

  private isClosed(): boolean {
    return this.state.isClosed();
  }

  private error(err: Error) {
    console.error(err);
    this.disconnected();
  }

  private input(input: Buffer) {
    let buffer: Buffer | undefined = undefined;
    try {
      if (this.previousInput) {
        buffer = Buffer.concat(
          [this.previousInput, input],
          this.previousInput.length + input.length
        );
        this.previousInput = undefined;
      } else {
        buffer = input;
      }
      const raw = this.transport.read(buffer);
      if (raw.size < buffer.length) {
        this.previousInput = buffer.slice(raw.size);
      }

      if (this.transport.hasWritesPending()) {
        this.output();
      } else if (this.isClosed()) {
        this.writer!.end();
      }
    } catch (e) {
      this.boxedError = e;
      this.dispatch('error', e);
      this.writer!.end();
    }
  }

  private output() {
    try {
      if (this.writer && this.socketReady) {
        this.transport.write(this.writer);
        if (
          (this.isClosed() || this.abortIdle || this.transportError) &&
          !this.transport.hasWritesPending()
        ) {
          this.writer.end();
        }
      }
    } catch (e) {
      this.boxedError = e;
      this.dispatch('error', e);
      this.writer!.end();
    }
  }

  private _connect() {
    const port = this.options.port!;
    const host = this.options.host!;
    return new Promise(resolve => {
      this.server = createServer({allowHalfOpen: true}, listener => {
        this.initWriter(listener);
        this.connected();
      });
      this.server.on('error', err => this.error(err));
      this.server.listen(port, host, () => {
        this.initListener(
          connect(port, host, () => {
            this.connected();
            resolve();
          })
        );
      });
    });
  }

  private connected() {
    this.socketReady = true;
    this.connectCounter++;
  }

  private getDefaultConnectConfig(given: Configuration) {
    const config = this.findConnectConfig();
    return {
      host: given.host || config.host || 'localhost',
      port: given.port || config.port || 5679,
      containerId: given.containerId || config.containerId || given.id || v4(),
      transport: given.transport || config.transport || 'tcp',
      reconnect: given.reconnect || config.reconnect || this.reconnectable(),
    };
  }

  private reconnectable(): ReconnectConfiguration {
    return {
      maxDelay: 60000,
      delay: 100,
      reconnect: true,
      limit: this.backoff(100, 60000),
    };
  }

  private backoff(initial: number, max: number) {
    let delay = initial;
    let reset = -1;
    return (attempts: number) => {
      if (reset !== attempts) {
        delay = initial;
        reset = attempts;
      }
      const current = delay;
      const next = delay * 2;
      delay = Math.min(max, next);
      return current;
    };
  }

  private findConnectConfig(): Configuration {
    const paths = process.env.MESSAGING_CONNECT_FILE
      ? [process.env.MESSAGING_CONNECT_FILE]
      : [
          cwd(),
          join(homedir(), '.config/messaging'),
          '/etc/messaging',
        ].map(base => join(base, '/connect.json'));

    for (const path of paths) {
      if (existsSync(path)) {
        return JSON.parse(readFileSync(path, 'utf8'));
      }
    }

    return {};
  }

  private disconnected() {
    const isFatal = !this.closedNonFatalError;
    if (!isFatal) {
      this.closedNonFatalError = false;
      if (this.options.reconnect?.reconnect) {
        this.connect();
      }
    }

    if ((!this.isClosed() || !isFatal) && !this.scheduledReconnect) {
      this.disconnect();
      if (!this.transportError && this.options.reconnect?.reconnect) {
        const delay = this.options.reconnect.limit!(this.connectCounter);
        if (delay >= 0) {
          this.scheduledReconnect = setTimeout(() => this.reconnect(), delay);
        }
      }
    }
    this.dispatch('disconnected');
  }

  private eof() {
    this.boxedError = undefined;
    this.disconnected();
  }

  private disconnect() {
    this.state.disconnected();
    this.socketReady = false;
  }

  private reconnect() {
    this.scheduledReconnect = undefined;
    if (this.abortIdle) {
      this.abortIdle = false;
      this.state = new State();
      this.state.open();
    }
    this.state.reconnect();
    this._connect();
    return this;
  }

  private sender() {
    return this.policy().sender();
  }

  dispatch(name: string, ...args: any): boolean {
    if (this.listeners(name).length) {
      EventEmitter.prototype.emit.apply(this, args);
      return true;
    }

    if (this.container) {
      return this.container.dispatch(name, ...args);
    }

    return false;
  }

  connect(): Promise<Connection> {
    return this._connect().then(() => this);
  }

  close() {
    if (this.writer && this.socketReady) {
      this.writer.end();
      this.writer.unpipe(this.writer);
    }

    if (this.listener) {
      this.listener.end();
    }
  }

  send(message: Message<unknown>) {
    if (!this.defaultSender) {
      this.defaultSender = this.sender();
    }
    return this.defaultSender.send(message);
  }

  createSession(): Session {
    return new Session(this);
  }
}
