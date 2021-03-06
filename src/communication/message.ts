import {Frame} from './frame';

export default class Message<T> {
  private readonly data: T;
  encode: () => Frame;
  decode: (frame: Frame) => T;

  constructor(
    plain: T,
    read: (plain: T) => string,
    write: (encoded: string) => T
  ) {
    this.data = plain;
    this.encode = function () {
      const encoded = read(this.data);
      return new Frame(Buffer.from(encoded));
    };
    // todo: fix deserialization
    this.decode = function (frame: Frame) {
      console.log('deserialize')
      const raw = frame.read();
      if (!raw.boxes) {
        return write('');
      }
      return write('');
      // return write(raw.box.unbox());
    };
  }

  toJSON() {
    const o: any = {};
    for (const k in this) {
      if (typeof k !== 'function') {
        o[k] = this[k];
      }
    }
    return o;
  }

  toString() {
    return JSON.stringify(this.toJSON());
  }
}
