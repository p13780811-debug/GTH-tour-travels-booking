/** Ordered, fully handled local writes. A failed save must not crash the app
 * or prevent a later save/clear from reaching device storage. */
export function createDeviceWriteQueue() {
 let pending:Promise<void>=Promise.resolve();
 return (write:()=>Promise<unknown>,onResult:(saved:boolean)=>void):Promise<void>=>{
  pending=pending.then(async()=>{
   try {await write();onResult(true);}
   catch {onResult(false);}
  });
  return pending;
 };
}
