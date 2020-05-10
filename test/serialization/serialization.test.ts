import {RW} from '../../src/serialization';

type NonRecursiveObject = {
  name: string;
  weight: number;
}

describe('test the object serialization/deserialization', function () {
  it('should serialize a simple uint8', function () {
    const number = 0x7f; // 2
    const buffer = RW.toBuffer(number);
    expect(buffer).toBeDefined();
    expect(buffer.length).toBe(2);
  });

  it('should serialize an number array', function () {
    const numbers = [
      0x7f, // 2
      0xffff, // 3
      0xffffffff // 5
    ];
    const buffer = RW.toBuffer(numbers);
    expect(buffer).toBeDefined();
    expect(buffer.length).toBe(2 + 3 + 5);
  });

  it('should serialize a string', function () {
    const name = 'jabolina';
    const buffer = RW.toBuffer(name);
    expect(buffer).toBeDefined();
    expect(buffer.length).toBe(4 + name.length);
  });

  it('should serialize a non recursive object', function () {
    const obj: NonRecursiveObject = {
      name: 'jabolina',
      weight: 0x7f
    };
    const buffer = RW.toBuffer(obj);
    expect(buffer).toBeDefined();
    expect(buffer.length).toBe(4 + obj.name.length + 2);
  });
});
