declare module "@mblaney/holster/src/holster.js" {
  export interface HolsterOptions {
    secure?: boolean;
  }

  export interface SEA {
    encrypt(data: any, pair: any): Promise<any>;
    decrypt(data: any, pair: any): Promise<any>;
    secret(epub: any, pair: any): Promise<any>;
    verify(data: any, pair: any): Promise<any>;
  }

  export interface User {
    is: any;
    auth(username: string, password: string, callback: (err: any) => void): void;
    get(path: string): any;
  }

  export interface Holster {
    SEA: SEA;
    user(): User;
  }

  export default function Holster(options?: HolsterOptions): Holster;
}