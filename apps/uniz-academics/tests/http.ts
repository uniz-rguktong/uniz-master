export function mockResponse() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    headers: {} as Record<string, string>,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
  };
  return res;
}

export function mockRequest(
  headers: Record<string, string | string[] | undefined> = {},
) {
  return {
    headers,
    ip: "203.0.113.8",
    originalUrl: "/academics/grades",
    socket: { remoteAddress: "127.0.0.1" },
    body: {} as unknown,
  };
}
