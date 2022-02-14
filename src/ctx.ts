export interface BootstrapWasm {
  handle_request: (
    kv: KVNamespace,
    method: string,
    op: string,
    input: Uint8Array,
  ) => Promise<{
    status: number
    headers: Array<[string, string]>
    body: Uint8Array
  }>
}

export class Ctx {
  constructor(
    public request: Request,
    public BOOTSTRAP: KVNamespace,
    public bootstrapWasm: BootstrapWasm,
  ) {}
}
