import {StringDecoder} from 'string_decoder';

export default class Box {
  private readonly _raw: Buffer;

  constructor(buffer: Buffer) {
    this._raw = buffer;
  }

  unbox(): string {
    if (this._raw.length === 0) {
      return '';
    }
    const decoder = new StringDecoder('utf8');
    return decoder.write(this._raw);
  }
}
