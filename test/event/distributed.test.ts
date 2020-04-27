import {DistributedEventEmitter} from '../../src/event/event-emitter';

const incoming = new DistributedEventEmitter();

describe('test the distributed event emitter', () => {
  it('should connect', () => {
    return expect(incoming.start())
      .resolves.toBe(incoming)
      .then(() => expect(incoming.isRunning()).toBeTruthy());
  });

  it('should emit to "news.private" > {data: "hello!"}', function () {
    expect.assertions(4);
    const messageIn = {data: undefined};
    const messageOut = {data: 'hello!'};
    return expect(incoming.start())
      .resolves.toBe(incoming)
      .then(() => {
        incoming.on('news.*', (data) => {
          console.log(data);
          expect(data).toBeDefined();
          expect(data).toBe(messageOut);
          messageIn.data = data;
        });
      })
      .then(() => expect(new Promise(resolve => {
        incoming.emit('news.private', messageOut);
        setTimeout(() => resolve(messageOut), 2000);
      })).resolves.toBe(messageOut))
      .then(() => expect(incoming.stop()).resolves);
  });
});

