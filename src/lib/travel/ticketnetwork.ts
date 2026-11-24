const DEFAULT_TRACKING_URL="https://www.jdoqocy.com/click-101921736-11072033";
const CJ_HOSTS=new Set(["www.jdoqocy.com","www.anrdoezrs.net","www.dpbolvw.net","www.kqzyfj.com","www.tkqlhce.com"]);

function trackingBase():URL {
  try {
    const url=new URL(process.env.NEXT_PUBLIC_TICKETNETWORK_AFFILIATE_URL??"");
    if(url.protocol==="https:"&&!url.username&&!url.password&&!url.port&&!url.search&&!url.hash&&
      CJ_HOSTS.has(url.hostname)&&/^\/click-\d+-\d+$/.test(url.pathname))return url;
  }catch{}
  return new URL(DEFAULT_TRACKING_URL);
}

export function ticketNetworkQuery(value:unknown):string {
  if(typeof value!=="string")return "";
  const query=value.slice(0,320).normalize("NFKC")
    .replace(/[^\p{L}\p{M}\p{N} .&’'()\-]/gu," ").replace(/\s+/g," ").trim().slice(0,120).trim();
  return /[\p{L}\p{N}]/u.test(query)?query:"";
}

export function ticketNetworkHref(value?:unknown):string {
  const link=trackingBase(),query=ticketNetworkQuery(value);
  if(query){
    const search=new URL("https://www.ticketnetwork.com/search");
    search.searchParams.set("q",query);
    link.searchParams.set("url",search.href);
  }
  return link.href;
}
