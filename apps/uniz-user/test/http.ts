export function mockRes() {
  const res: any = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
    send(body: unknown) {
      this.body = body;
      return this;
    },
    setHeader(name: string, value: string) {
      this.headers[name] = value;
      return this;
    },
  };
  return res;
}

export function mockReq(partial: Record<string, any> = {}) {
  return {
    query: {},
    params: {},
    body: {},
    ip: "127.0.0.1",
    originalUrl: "/test",
    method: "GET",
    url: "/test",
    ...partial,
    headers: { ...(partial.headers || {}) },
  };
}
