import {RW} from '../../src/serialization';

type NonRecursiveObject = {
  name: string;
  weight: number;
}

describe('test the object serialization/deserialization', function () {
  it('should serialize the number and then deserialize', function () {
    const number = 0x7f;
    const buffer = RW.toBuffer(number);
    expect(buffer).toBeDefined();
    expect(buffer.length).toBe(2);
    
    const deserialized = RW.fromBuffer<number>(buffer);
    expect(deserialized).toBeDefined();
    expect(deserialized).toBe(number);
  });

  it('should serialize the string and then deserialize', function () {
    const name = 'hello'; // 1 + 4 + ..
    const buffer = RW.toBuffer(name);
    expect(buffer).toBeDefined();
    expect(buffer.length).toBe(1 + 1 + 4 + name.length);

    const deserialized = RW.fromBuffer<string>(buffer);
    expect(deserialized).toBeDefined();
    expect(deserialized).toBe(name);
  });

  it('should serialize the array and then deserialize', function () {
    const numbers = [
      0x7f, // 2
      0xffff, // 3
      0xffffffff // 5
    ]; // 1
    const buffer = RW.toBuffer(numbers);
    expect(buffer).toBeDefined();
    expect(buffer.length).toBe(1 + (1 + 1) + (1 + 2) + (1 + 4));

    const deserialized = RW.fromBuffer<string>(buffer);
    expect(deserialized).toBeDefined();
    expect(deserialized).toStrictEqual(numbers);
  });

  it('should serialize and deserialize non recursive object', function () {
    const obj: NonRecursiveObject = {
      name: 'jabolina', // 1 + 4 + 4 + 1 + 4 + 8
      weight: 0x7f // 1 + 4 + 6 + 1 + 1 
    }; // 1
    const buffer = RW.toBuffer(obj);
    expect(buffer).toBeDefined();
    expect(buffer.length).toBe(1 + (1 + 1 + 4 + 4 + 1 + 1 + 4 + obj.name.length) + (1 + 1 + 4 + 6 + 1 + 1));

    const deserialized = RW.fromBuffer<NonRecursiveObject>(buffer);
    expect(deserialized).toBeDefined();
    expect(deserialized).toStrictEqual(obj);
  });
});
