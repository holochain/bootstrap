export interface WasmHost {
  get_timestamp_millis: () => number
}

export interface BootstrapWasm {
  handle_request: (
    kv: KVNamespace,
    host: WasmHost,
    method: string,
    op: string,
    net: string,
    input: Uint8Array,
  ) => Promise<{
    status: number
    headers: Array<[string, string]>
    body: Uint8Array
  }>

  handle_scheduled: (kv: KVNamespace, host: WasmHost) => Promise<void>
}

export const wasmHost = {
  get_timestamp_millis: Date.now.bind(Date),
}

export class Ctx {
  public wasmError?: string = undefined
  public wasmHost: WasmHost = wasmHost
  public net: string = 'tx2'

  constructor(
    public request: Request,
    public BOOTSTRAP: KVNamespace,
    public bootstrapWasm: BootstrapWasm,
  ) {}

  newResponse(bodyInit?: BodyInit | null, maybeInit?: ResponseInit): Response {
    maybeInit = maybeInit || {}
    const headers = new Headers(maybeInit.headers)
    if (this.wasmError) {
      headers.append('X-WasmError', this.wasmError)
    }
    maybeInit.headers = headers
    return new Response(bodyInit, maybeInit)
  }
}
