/** User-initiated local export; no network request or remote storage. */
export function downloadResearchText(text:string,mime:string,filename:string):boolean{
 try{const url=URL.createObjectURL(new Blob([text],{type:mime}));const link=document.createElement("a");link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return true;}catch{return false;}
}
