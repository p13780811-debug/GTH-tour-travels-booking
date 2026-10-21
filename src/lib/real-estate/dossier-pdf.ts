import "server-only";
import sharp from "sharp";

type Dossier = {
 title:string;location:string;reference:string;source:string;
 status:string;price:string;date:string;attribution:string;image?:Buffer
};
const escapeXml=(s:string)=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
function shorten(s:string,length:number):string {return s.trim().slice(0,length);}
function label(x:number,y:number,content:string,size=24):string{
 return '<text x="'+x+'" y="'+y+'" font-size="'+size+'">'+escapeXml(content)+'</text>';
}
function renderPdfJpeg(image:Buffer,width:number,height:number):Uint8Array{
 const command=Buffer.from("q\n595 0 0 842 0 0 cm\n/Im0 Do\nQ\n","ascii");
 const objects:Buffer[]=[
  Buffer.from("<< /Type /Catalog /Pages 2 0 R >>"),
  Buffer.from("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
  Buffer.from("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>"),
  Buffer.concat([Buffer.from("<< /Type /XObject /Subtype /Image /Width "+width+" /Height "+height+" /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length "+image.length+" >>\nstream\n"),image,Buffer.from("\nendstream")]),
  Buffer.concat([Buffer.from("<< /Length "+command.length+" >>\nstream\n"),command,Buffer.from("endstream")])
 ];
 const parts:Buffer[]=[Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n","binary")],offsets:number[]=[0];
 let position=parts[0].length;
 for(let i=0;i<objects.length;i++){
  const obj=Buffer.concat([Buffer.from(String(i+1)+" 0 obj\n"),objects[i],Buffer.from("\nendobj\n")]);
  offsets.push(position);position+=obj.length;parts.push(obj);
 }
 const xref=position;
 let trailer="xref\n0 "+(objects.length+1)+"\n0000000000 65535 f \n";
 for(const pos of offsets.slice(1))trailer+=String(pos).padStart(10,"0")+" 00000 n \n";
 trailer+="trailer\n<< /Size "+(objects.length+1)+" /Root 1 0 R >>\nstartxref\n"+xref+"\n%%EOF\n";
 return new Uint8Array(Buffer.concat([...parts,Buffer.from(trailer)]));
}
export async function createDossierPdf(data:Dossier):Promise<Uint8Array>{
 const width=1240,height=1754;
 let photo="",imageNote="No image approved for dossier redistribution.";
 if(data.image){
  const jpeg=await sharp(data.image,{limitInputPixels:18000000}).rotate().resize(1100,490,{fit:"cover"}).flatten({background:"#fff"}).jpeg({quality:78}).toBuffer();
  photo='<image x="70" y="456" width="1100" height="490" href="data:image/jpeg;base64,'+jpeg.toString("base64")+'"/>';
  imageNote="Approved media: "+shorten(data.attribution,100);
 }
 const svg=[
 '<svg xmlns="http://www.w3.org/2000/svg" width="1240" height="1754">',
 '<rect width="1240" height="1754" fill="#f8f7f4"/>',
 '<rect width="1240" height="278" fill="#061426"/>',
 '<rect x="70" y="55" width="10" height="65" fill="#c5a45b"/>',
 '<g fill="#fff" font-family="Noto Sans,Arial,sans-serif" font-weight="bold">',
 label(107,108,"GTH PRO",44),label(70,207,"PROPERTY RESEARCH DOSSIER",47),'</g>',
 '<g font-family="Noto Sans,Arial,sans-serif" fill="#182c41">',
 '<g fill="#967339" font-weight="bold">',label(70,331,"SOURCE-AWARE PROJECT RECORD",22),'</g>',
 '<g font-weight="bold">',label(70,400,shorten(data.title,56),33),'</g>',
 '<rect x="70" y="456" width="1100" height="490" rx="12" fill="#e9e3d6"/>',photo,
 '<g fill="#566779">',label(70,982,imageNote,18),'</g>',
 '<rect x="70" y="1020" width="1100" height="433" rx="15" fill="#fff" stroke="#e2d8c9"/>',
 '<g fill="#967339" font-weight="bold">',label(105,1084,"RECORDED FACTS",24),'</g>',
 label(105,1144,"Location: "+shorten(data.location,75),21),
 label(105,1200,"Registry reference: "+shorten(data.reference||"Not recorded",70),21),
 label(105,1256,"Status: "+shorten(data.status,76),21),
 label(105,1312,"Price: "+shorten(data.price,78),21),
 '<g fill="#566779">',label(105,1380,"Official source: "+shorten(data.source||"Not supplied",85),17),'</g>',
 '<g font-weight="bold">',label(70,1520,"official@gthproglobal.com",22),'</g>',
 '<g fill="#566779">',label(70,1574,"Prepared "+data.date+" | GTH PRO Global Technical Hub",18),'</g>',
 '<path d="M70 1608 H1170" stroke="#c6af80" stroke-width="2"/>',
 '<g fill="#566779">',label(70,1652,"Research only: not legal title verification, price guarantee or a booking.",16),
 label(70,1691,"Confirm inventory, project details and transport conditions with sources.",16),'</g>',
 '</g></svg>'
 ].join("");
 const jpeg=await sharp(Buffer.from(svg),{limitInputPixels:20000000}).flatten({background:"#fff"}).jpeg({quality:79}).toBuffer();
 return renderPdfJpeg(jpeg,width,height);
}
