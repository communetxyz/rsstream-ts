declare module "@mblaney/holster/src/holster.js" {
  export interface HolsterOptions {
    peers?: string[];
    secure?: boolean;
    indexedDB?: boolean;
  }

  export interface SEA {
    encrypt(data: any, pair: any): Promise<any>;
    decrypt(data: any, pair: any): Promise<any>;
    secret(epub: any, pair: any): Promise<any>;
    verify(data: any, pair: any): Promise<any>;
    sign(data: any, pair: any): Promise<any>;
    pair(): Promise<any>;
  }

  export interface User {
    is: any;
    auth(username: string, password: string, callback?: (ack: any) => void): void;
    create(username: string, password: string, callback?: (ack: any) => void): void;
    get(path: string): any;
    recall(opts?: any): void;
    leave(): void;
  }

  export interface Holster {
    SEA: SEA;
    user(): User;
    on(event: string, callback: Function): void;
    off: any;
  }

  export default function Holster(options?: HolsterOptions): Holster;
}

declare module "@mblaney/holster/src/holster" {
  export interface HolsterOptions {
    peers?: string[];
    secure?: boolean;
    indexedDB?: boolean;
  }

  export interface SEA {
    encrypt(data: any, pair: any): Promise<any>;
    decrypt(data: any, pair: any): Promise<any>;
    secret(epub: any, pair: any): Promise<any>;
    verify(data: any, pair: any): Promise<any>;
    sign(data: any, pair: any): Promise<any>;
    pair(): Promise<any>;
  }

  export interface User {
    is: any;
    auth(username: string, password: string, callback?: (ack: any) => void): void;
    create(username: string, password: string, callback?: (ack: any) => void): void;
    get(path: string): any;
    recall(opts?: any): void;
    leave(): void;
  }

  export interface Holster {
    SEA: SEA;
    user(): User;
    on(event: string, callback: Function): void;
    off: any;
  }

  export default function Holster(options?: HolsterOptions): Holster;
}

declare global {
  interface Window {
    holster: any;
  }
}