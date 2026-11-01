type Constructed = {
  opts: unknown;
  ons: unknown[][];
  $on: (...args: unknown[]) => void;
};

const registry = globalThis as { __prismaClients?: Constructed[] };

export class PrismaClient {
  opts: unknown;
  ons: unknown[][] = [];
  constructor(opts: unknown) {
    this.opts = opts;
    registry.__prismaClients = registry.__prismaClients || [];
    registry.__prismaClients.push(this);
  }
  $on(...args: unknown[]) {
    this.ons.push(args);
  }
}
