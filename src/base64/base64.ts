export function atob64(a:Uint8Array):string {
 return Buffer.from(a).toString('base64')
}
