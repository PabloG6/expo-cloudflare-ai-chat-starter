/**
 * Polyfills for React Native to support partysocket/agents
 * These browser APIs don't exist in React Native's JavaScript environment
 */

try {
  const streams = require("web-streams-polyfill/ponyfill");
  if (typeof globalThis.ReadableStream === "undefined") {
    (globalThis as any).ReadableStream = streams.ReadableStream;
  }
  if (typeof globalThis.WritableStream === "undefined") {
    (globalThis as any).WritableStream = streams.WritableStream;
  }
  if (typeof globalThis.TransformStream === "undefined") {
    (globalThis as any).TransformStream = streams.TransformStream;
  }
} catch {
  // ignore
}

if (typeof (globalThis as any).Event === "undefined") {
  (globalThis as any).Event = class Event {
    type: string;
    bubbles: boolean;
    cancelable: boolean;
    defaultPrevented: boolean;
    target: unknown;

    constructor(type: string, init?: EventInit) {
      this.type = type;
      this.bubbles = Boolean(init?.bubbles);
      this.cancelable = Boolean(init?.cancelable);
      this.defaultPrevented = false;
      this.target = null;
    }

    preventDefault() {
      if (this.cancelable) this.defaultPrevented = true;
    }
  };
}

if (typeof (globalThis as any).EventTarget === "undefined") {
  (globalThis as any).EventTarget = class EventTarget {
    private _listeners = new Map<string, Set<(evt: any) => void>>();

    addEventListener(type: string, listener: ((evt: any) => void) | null) {
      if (!listener) return;
      const set = this._listeners.get(type) ?? new Set();
      set.add(listener);
      this._listeners.set(type, set);
    }

    removeEventListener(type: string, listener: ((evt: any) => void) | null) {
      if (!listener) return;
      const set = this._listeners.get(type);
      if (!set) return;
      set.delete(listener);
      if (set.size === 0) this._listeners.delete(type);
    }

    dispatchEvent(event: any) {
      if (!event || !event.type) return true;
      event.target = this;
      const set = this._listeners.get(String(event.type));
      if (!set) return true;
      for (const listener of set) {
        try {
          listener.call(this, event);
        } catch {
          // ignore listener errors in polyfill
        }
      }
      return !event.defaultPrevented;
    }
  };
}

try {
  const NativeResponse = globalThis.Response;
  if (NativeResponse) {
    class PatchedResponse extends (NativeResponse as any) {
      constructor(body?: any, init?: any) {
        if (body && typeof body === "object" && typeof body.getReader === "function") {
          super("", { ...(init ?? {}), status: init?.status ?? 200 });
          try {
            Object.defineProperty(this, "body", { value: body, configurable: true });
          } catch {
            // ignore
          }
          return;
        }
        super(body, init);
      }
    }
    (globalThis as any).Response = PatchedResponse;
  }
} catch {
  // ignore
}

if (typeof globalThis.MessageEvent === "undefined") {
  (globalThis as any).MessageEvent = class MessageEvent extends Event {
    data: any;
    origin: string;
    lastEventId: string;
    source: any;
    ports: any[];

    constructor(type: string, eventInitDict?: MessageEventInit) {
      super(type, eventInitDict);
      this.data = eventInitDict?.data ?? null;
      this.origin = eventInitDict?.origin ?? "";
      this.lastEventId = eventInitDict?.lastEventId ?? "";
      this.source = eventInitDict?.source ?? null;
      this.ports = eventInitDict?.ports ?? [];
    }
  };
}

if (typeof globalThis.CloseEvent === "undefined") {
  (globalThis as any).CloseEvent = class CloseEvent extends Event {
    code: number;
    reason: string;
    wasClean: boolean;

    constructor(type: string, eventInitDict?: CloseEventInit) {
      super(type, eventInitDict);
      this.code = eventInitDict?.code ?? 1000;
      this.reason = eventInitDict?.reason ?? "";
      this.wasClean = eventInitDict?.wasClean ?? true;
    }
  };
}

if (typeof globalThis.ErrorEvent === "undefined") {
  (globalThis as any).ErrorEvent = class ErrorEvent extends Event {
    message: string;
    filename: string;
    lineno: number;
    colno: number;
    error: any;

    constructor(type: string, eventInitDict?: ErrorEventInit) {
      super(type, eventInitDict);
      this.message = eventInitDict?.message ?? "";
      this.filename = eventInitDict?.filename ?? "";
      this.lineno = eventInitDict?.lineno ?? 0;
      this.colno = eventInitDict?.colno ?? 0;
      this.error = eventInitDict?.error ?? null;
    }
  };
}

export {};
