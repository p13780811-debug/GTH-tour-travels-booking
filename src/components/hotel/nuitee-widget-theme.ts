/** Adapt neutral vendor surfaces/text without relying on undocumented class
 * names. Supplier content, images, coloured badges and click handlers stay owned
 * by the SDK. CSS variables keep the marks responsive to the GTH theme. */
function neutralColor(value:string):{solid:boolean;neutral:boolean;channel:number}|null{
  const match=value.match(/^rgba?\(\s*([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)$/);
  if(!match)return null;
  const channels=match.slice(1,4).map(Number),alpha=Number(match[4]??1);
  return {solid:alpha>=.95,neutral:Math.max(...channels)-Math.min(...channels)<=24,channel:channels.reduce((sum,c)=>sum+c,0)/3};
}
const marks=["data-gth-nuitee-surface","data-gth-nuitee-ink","data-gth-nuitee-border"];
export function connectNuiteeWidgetTheme(root:HTMLElement):()=>void{
  let frame=0,active=true;
  const clear=(element:HTMLElement)=>{for(const mark of marks)element.removeAttribute(mark);};
  const apply=()=>{
    frame=0;if(!active||!root.isConnected)return;
    const elements=Array.from(root.querySelectorAll("*")).filter((e):e is HTMLElement=>e instanceof HTMLElement).slice(0,4000);
    // Read the vendor's current palette before applying our marks. This also
    // handles badges whose vendor classes/colours change after async results.
    for(const element of elements)clear(element);
    const styles=new Map(elements.map(element=>[element,getComputedStyle(element)]));
    const surfaces:HTMLElement[]=[],inks:{element:HTMLElement;muted:boolean}[]=[],borders:HTMLElement[]=[];
    for(const element of elements){
      const style=styles.get(element)!;
      const background=neutralColor(style.backgroundColor);
      if(background?.solid&&background.neutral&&style.backgroundImage==="none")surfaces.push(element);
      const border=neutralColor(style.borderTopColor);
      if(border?.solid&&border.neutral&&parseFloat(style.borderTopWidth)>0)borders.push(element);
      if(!Array.from(element.childNodes).some(node=>node.nodeType===Node.TEXT_NODE&&node.textContent?.trim()))continue;
      const foreground=neutralColor(style.color);if(!foreground?.neutral)continue;
      let ownPalette=false;
      for(let parent:HTMLElement|null=element;parent&&parent!==root;parent=parent.parentElement){
        const parentStyle=styles.get(parent);if(!parentStyle)break;
        const backdrop=neutralColor(parentStyle.backgroundColor);
        if(parentStyle.backgroundImage!=="none"){ownPalette=true;break;}
        if(backdrop?.solid){ownPalette=!backdrop.neutral;break;}
        // Preserve white image-overlay captions, rather than making them dark.
        if(parentStyle.backgroundColor!=="transparent"&&backdrop&&!backdrop.solid&&parentStyle.backgroundColor!=="rgba(0, 0, 0, 0)"){ownPalette=true;break;}
      }
      if(!ownPalette)inks.push({element,muted:foreground.channel>75&&foreground.channel<200});
    }
    for(const element of surfaces)element.setAttribute("data-gth-nuitee-surface","");
    for(const {element,muted}of inks)element.setAttribute("data-gth-nuitee-ink",muted?"muted":"text");
    for(const element of borders)element.setAttribute("data-gth-nuitee-border","");
  };
  const queue=()=>{if(active&&!frame)frame=requestAnimationFrame(apply);};
  const observer=new MutationObserver(queue);
  observer.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:["class","style"]});
  const theme=new MutationObserver(queue);theme.observe(document.documentElement,{attributes:true,attributeFilter:["class"]});
  root.addEventListener("load",queue,true);queue();
  return ()=>{active=false;cancelAnimationFrame(frame);observer.disconnect();theme.disconnect();root.removeEventListener("load",queue,true);for(const element of root.querySelectorAll<HTMLElement>("[data-gth-nuitee-surface],[data-gth-nuitee-ink],[data-gth-nuitee-border]"))clear(element);};
}
