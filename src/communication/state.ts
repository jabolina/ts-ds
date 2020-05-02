export default class State {
  private localOpen: boolean;
  private wasOpen: boolean;
  private openRequests: number;
  private closeRequests: number;
  private initialised: boolean;
  private marker?: string;
  private server: boolean;

  constructor() {
    this.localOpen = false;
    this.openRequests = 0;
    this.closeRequests = 0;
    this.wasOpen = false;
    this.initialised = false;
    this.marker = undefined;
    this.server = false;
  }

  init() {
    this.localOpen = false;
    this.openRequests = 0;
    this.closeRequests = 0;
    this.initialised = false;
    this.marker = undefined;
  }

  mark(token?: string) {
    this.marker = token || Date.now().toString(10);
    return this.marker;
  }

  open() {
    this.marker = undefined;
    this.initialised = true;
    if (!this.open) {
      this.localOpen = true;
      this.openRequests++;
      return true;
    }

    return false;
  }

  close() {
    this.marker = undefined;
    if (this.localOpen) {
      this.localOpen = false;
      this.closeRequests++;
      return true;
    }
    return false;
  }

  disconnected() {
    const initialised = this.initialised;
    this.wasOpen = this.localOpen;
    this.init();
    this.initialised = initialised;
  }

  reconnect() {
    if (this.wasOpen) {
      this.open();
      this.wasOpen = false;
    }
  }

  isOpen() {
    return this.localOpen;
  }

  isClosed() {
    return this.initialised && !(this.localOpen || this.wasOpen);
  }

  needOpen() {
    if (this.openRequests > 0) {
      this.openRequests--;
      return true;
    }
    return false;
  }

  needClose() {
    if (this.closeRequests > 0) {
      this.closeRequests--;
      return true;
    }
    return false;
  }

  isServer(set?: boolean) {
    if (set !== undefined && set !== null) {
      this.server = set;
    }
    return this.server;
  }
}
