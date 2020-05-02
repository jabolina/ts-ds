import {StringDecoder} from 'string_decoder';

export default class Box {
  readonly _raw: Buffer;
  readonly size: number;

  constructor(buffer: Buffer) {
    this._raw = buffer;
    this.size = buffer.length;
  }

  unbox(): string {
    if (this._raw.length === 0) {
      return '';
    }
    const decoder = new StringDecoder('utf8');
    return decoder.write(this._raw);
  }
}
