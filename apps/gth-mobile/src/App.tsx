import React,{useEffect,useMemo,useState} from "react";
import {
 ActivityIndicator,Alert,BackHandler,Image,ImageBackground,Keyboard,Linking,Pressable,
 Platform,ScrollView,Share,StatusBar,StyleSheet,Text,TextInput,useColorScheme,View,type ImageSourcePropType,
} from "react-native";
import {SafeAreaProvider,SafeAreaView} from "react-native-safe-area-context";
import {
 ArrowLeft,ArrowRight,Bookmark,BookmarkCheck,Building2,Clock3,Compass,ExternalLink,
 FileText,Globe2,Home,Hotel,MapPin,Plane,Search,Share2,ShieldCheck,Sparkles,
} from "lucide-react-native";
import colors from "./theme/generated.json";
import travelHero from "../assets/hero/travel.jpg";
import propertyHero from "../assets/hero/property.jpg";
import tenderHero from "../assets/hero/tender.jpg";
import brandLogo from "../assets/branding/logo.png";
import {type DiscoveryCard,type DiscoveryKind} from "./core/catalog";
import {searchNativeSources,type SearchSlice} from "./core/unified-search";
import {detectPillar,firstPartyUrl,normalizeQuery,serviceDestination,type Pillar} from "./core/routing";
import {useNativeBookmarks} from "./core/bookmarks";
import {useRecentSearches} from "./core/recent-searches";

type Theme=typeof colors.light;
type Tab="home"|"discover"|"saved"|"services";
type NativeChoice=DiscoveryKind|"all"|"travel";
const filters:{kind:NativeChoice;title:string}[]=[
 {kind:"all",title:"All"},{kind:"hotel",title:"Hotels"},{kind:"property",title:"Property"},
 {kind:"tender",title:"Tenders"},{kind:"tour",title:"Tours"},
];
const panel:{kind:Pillar;heading:string;caption:string;image:ImageSourcePropType}[]=[
 {kind:"travel",heading:"Go further.",caption:"Flights, destinations and experiences.",image:travelHero},
 {kind:"property",heading:"Find your place.",caption:"Explore property and registry records.",image:propertyHero},
 {kind:"tender",heading:"Build what is next.",caption:"Find published business opportunities.",image:tenderHero},
];
const serviceLinks:{label:string;path:string;kind:Pillar;mode:"native"|"web";description:string}[]=[
 {label:"Flights",path:"/app/flights",kind:"travel",mode:"web",description:"Real flight search, dates and suppliers"},
 {label:"Hotels",path:"/app/hotels",kind:"hotel",mode:"native",description:"Browse published accommodation records"},
 {label:"Real Estate",path:"/app/property",kind:"property",mode:"native",description:"Discover property projects and registry data"},
 {label:"Public tenders",path:"/app/tenders",kind:"tender",mode:"native",description:"Explore official notices and deadlines"},
 {label:"Airport transfers",path:"/transfers",kind:"travel",mode:"web",description:"Existing airport pickup and transfer partners"},
 {label:"Car rentals",path:"/cars",kind:"travel",mode:"web",description:"Original car rental search and providers"},
 {label:"Tours & activities",path:"/tours",kind:"tour",mode:"native",description:"Discover listed tours and activities"},
 {label:"Travel protection",path:"/insurance",kind:"travel",mode:"web",description:"Read actual policy terms from approved providers"},
 {label:"Destinations",path:"/app/destinations",kind:"travel",mode:"web",description:"Existing city guides and attractions"},
 {label:"Travel eSIM",path:"/flights/out/yesim",kind:"travel",mode:"web",description:"Existing connectivity partner handoff"},
 {label:"Saved properties",path:"/real-estate/saved",kind:"property",mode:"web",description:"Website property workspace and sign-in"},
 {label:"Property tools",path:"/real-estate/tools",kind:"property",mode:"web",description:"Existing finance and project calculators"},
 {label:"Saved tenders",path:"/tender/saved",kind:"tender",mode:"web",description:"Original tender watchlist and account access"},
 {label:"Tender services",path:"/tender/services",kind:"tender",mode:"web",description:"Original assistance and document workflows"},
];

function TextLabel({text,theme}:{text:string;theme:Theme}){
 return <Text style={[styles.eyebrow,{color:theme.accent}]}>{text.toUpperCase()}</Text>;
}
function Action({label,onPress,theme,secondary=false}:{label:string;onPress:()=>void;theme:Theme;secondary?:boolean}){
 return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}
  style={({pressed})=>[styles.action,{backgroundColor:secondary?theme.surfaceSoft:theme.accent,opacity:pressed?0.78:1}]}>
  <Text style={{fontSize:13,fontWeight:"800",color:secondary?theme.text:theme.onAccent}}>{label}</Text>
  <ArrowRight size={16} color={secondary?theme.text:theme.onAccent}/>
 </Pressable>;
}
function Header({theme,openSaved}:{theme:Theme;openSaved:()=>void}){
 return <View style={[styles.header,{borderColor:theme.border}]}>
  <View style={{flexDirection:"row",alignItems:"center",gap:9}}>
   <View style={[styles.brandMark,{borderColor:theme.accent}]}><Image source={brandLogo} resizeMode="cover" accessibilityLabel="GTH PRO logo" style={{width:37,height:37,borderRadius:11}}/></View>
   <View><Text style={[styles.brandName,{color:theme.text}]}>GTH <Text style={{color:theme.accent}}>PRO</Text></Text>
    <Text style={{fontSize:10,color:theme.muted}}>THE GLOBAL EXPERIENCE</Text>
   </View>
  </View>
  <Pressable accessibilityRole="button" accessibilityLabel="Open saved records" onPress={openSaved}
   style={[styles.roundIcon,{backgroundColor:theme.surface,borderColor:theme.border}]}>
   <Bookmark size={20} color={theme.accent}/>
  </Pressable>
 </View>;
}
function Hero({theme,onSearch,onExplore,onQuick,query,setQuery}:{theme:Theme;onSearch:()=>void;onExplore:()=>void;onQuick:(query:string)=>void;query:string;setQuery:(v:string)=>void}){
 return <View style={[styles.hero,{backgroundColor:theme.surface,borderColor:theme.border}]}>
  <View style={{flexDirection:"row",alignItems:"center",gap:7}}>
   <Sparkles size={15} color={theme.accent}/>
   <TextLabel text="ONE WORLD · LIMITLESS POSSIBILITIES" theme={theme}/>
  </View>
  <Text style={[styles.h1,{color:theme.text}]}>Your world.{"\n"}One brilliant app.</Text>
  <Text style={[styles.lead,{color:theme.muted}]}>
   Travel, discover places and find business opportunities in a space designed around you.
  </Text>
  <View style={[styles.searchRow,{backgroundColor:theme.bg,borderColor:theme.border}]}>
   <Search size={20} color={theme.accent}/>
   <TextInput placeholder="Goa hotels, Mumbai homes, tenders…"
    placeholderTextColor={theme.muted} value={query} onChangeText={setQuery}
    onSubmitEditing={onSearch} returnKeyType="search" autoCorrect={false}
    accessibilityLabel="Universal search" style={[styles.searchInput,{color:theme.text}]}/>
   <Pressable onPress={onSearch} accessibilityRole="button" accessibilityLabel="Search GTH PRO"
    style={[styles.searchGo,{backgroundColor:theme.accent}]}>
    <ArrowRight size={21} color={theme.onAccent}/>
   </Pressable>
  </View>
  <View style={{flexDirection:"row",flexWrap:"wrap",gap:8,marginTop:12,alignItems:"center"}}>
   <Text style={{fontSize:11,fontWeight:"700",color:theme.muted}}>Try:</Text>
   {[{q:"Goa hotels",label:"Goa hotels"},{q:"Mumbai property",label:"Mumbai homes"},{q:"construction tender",label:"Tenders"}].map(item=>
    <Pressable key={item.q} accessibilityRole="button" accessibilityLabel={"Search "+item.q}
     onPress={()=>onQuick(item.q)} style={[styles.chip,{backgroundColor:theme.surfaceSoft,borderColor:theme.border,minHeight:37,paddingHorizontal:12}]}>
     <Text style={{fontSize:11,fontWeight:"700",color:theme.text}}>{item.label}</Text>
    </Pressable>)}
  </View>
  <Pressable accessibilityRole="button" accessibilityLabel="Explore all services" onPress={onExplore} style={{paddingVertical:7,alignSelf:"flex-start",marginTop:5}}> 
   <Text style={{fontSize:12,fontWeight:"700",color:theme.accent}}>Explore all services  ↗</Text>
  </Pressable>
 </View>;
}
function Journey({theme,onOpen}:{theme:Theme;onOpen:(kind:Pillar)=>void}){
 return <View style={{marginTop:24}}>
  <TextLabel text="CURATED FOR YOUR NEXT MOVE" theme={theme}/>
  <Text style={[styles.sectionTitle,{color:theme.text}]}>Explore your possibilities</Text>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={270} decelerationRate="fast"
   contentContainerStyle={{gap:12,paddingRight:18,paddingBottom:3}}>
   {panel.map(card=><Pressable key={card.kind} onPress={()=>onOpen(card.kind)}
     accessibilityRole="button" accessibilityLabel={card.heading+" "+card.caption}
     style={[styles.journeyCard,{borderColor:theme.border,backgroundColor:theme.surface}]}>
    <ImageBackground source={card.image} imageStyle={{borderTopLeftRadius:19,borderTopRightRadius:19}}
     style={{height:132,justifyContent:"flex-end",padding:12}}>
     <View style={[styles.journeyBadge,{backgroundColor:theme.surface}]}>
      {card.kind==="travel"?<Plane size={17} color={theme.accent}/>:
       card.kind==="property"?<Building2 size={17} color={theme.accent}/>:
       <FileText size={17} color={theme.accent}/>}
     </View>
    </ImageBackground>
    <View style={{padding:14,gap:5}}>
     <Text style={{fontSize:18,fontWeight:"800",color:theme.text}}>{card.heading}</Text>
     <Text style={{fontSize:12,lineHeight:18,color:theme.muted}}>{card.caption}</Text>
     <View style={{flexDirection:"row",alignItems:"center",gap:6,marginTop:4}}>
      <Text style={{color:theme.accent,fontSize:12,fontWeight:"800"}}>Discover</Text>
      <ArrowRight size={15} color={theme.accent}/>
     </View>
    </View>
   </Pressable>)}
  </ScrollView>
 </View>;
}
function RecordCard({item,theme,bookmarked,onOpen,onToggle}:{item:DiscoveryCard;theme:Theme;bookmarked:boolean;onOpen:()=>void;onToggle:()=>void}){
 return <View style={[styles.record,{backgroundColor:theme.surface,borderColor:theme.border}]}>
  <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={"Details for "+item.title}
   style={{flexDirection:"row",alignItems:"center",gap:12,flex:1}}>
   <View style={[styles.recordIcon,{backgroundColor:theme.surfaceSoft}]}>
    {item.image?<Image source={{uri:item.image}} resizeMode="cover"
      accessible accessibilityLabel={"Editorial image for "+item.title}
      style={{height:64,width:64,borderRadius:13}}/>:
     item.kind==="hotel"?<Hotel size={25} color={theme.accent}/>:
     item.kind==="property"?<Building2 size={25} color={theme.accent}/>:
     item.kind==="tender"?<FileText size={25} color={theme.accent}/>:
     <MapPin size={25} color={theme.accent}/>}
   </View>
   <View style={{flex:1,gap:4}}>
    <Text numberOfLines={2} style={{fontSize:14,fontWeight:"800",color:theme.text}}>{item.title}</Text>
    <Text numberOfLines={1} style={{fontSize:12,color:theme.muted}}>{item.subtitle}</Text>
    <Text numberOfLines={1} style={{fontSize:11,color:theme.accent}}>{item.tag||item.source}</Text>
   </View>
   <ArrowRight size={18} color={theme.muted}/>
  </Pressable>
  {item.webPath&&<Pressable onPress={onToggle} accessibilityRole="button"
    accessibilityLabel={(bookmarked?"Remove saved ":"Save ")+item.title} accessibilityState={{selected:bookmarked}}
    style={[styles.bookmarkButton,{borderColor:theme.border}]}>
    {bookmarked?<BookmarkCheck size={19} color={theme.accent}/>:<Bookmark size={19} color={theme.muted}/>}
   </Pressable>}
 </View>;
}
function BottomBar({tab,setTab,theme}:{tab:Tab;setTab:(v:Tab)=>void;theme:Theme}){
 const tabs=[
  {id:"home" as Tab,title:"Home",Icon:Home},
  {id:"discover" as Tab,title:"Discover",Icon:Search},
  {id:"saved" as Tab,title:"Saved",Icon:Bookmark},
  {id:"services" as Tab,title:"Services",Icon:Compass},
 ];
 return <SafeAreaView edges={["bottom"]} style={{borderTopWidth:1,borderColor:theme.border,backgroundColor:theme.surface}}>
  <View style={styles.tabbar}>{tabs.map(({id,title,Icon})=><Pressable key={id} onPress={()=>setTab(id)}
    accessibilityRole="tab" accessibilityState={{selected:tab===id}}
    accessibilityLabel={title+" tab"} style={styles.tab}>
    <Icon size={22} color={tab===id?theme.accent:theme.muted} strokeWidth={tab===id?2.5:1.7}/>
    <Text style={{fontSize:10,fontWeight:tab===id?"800":"600",color:tab===id?theme.accent:theme.muted}}>{title}</Text>
   </Pressable>)}</View>
 </SafeAreaView>;
}
function NativeApp(){
 const dark=useColorScheme()==="dark";
 const theme=dark?colors.dark:colors.light;
 const [tab,setTab]=useState<Tab>("home");
 const [query,setQuery]=useState("");
 const [term,setTerm]=useState("");
 const [kind,setKind]=useState<NativeChoice>("all");
 const [results,setResults]=useState<DiscoveryCard[]>([]);
 const [slices,setSlices]=useState<SearchSlice[]>([]);
 const [warnings,setWarnings]=useState<string[]>([]);
 const [total,setTotal]=useState(0);
 const [pending,setPending]=useState(false);
 const [error,setError]=useState("");
 const [detail,setDetail]=useState<DiscoveryCard|null>(null);
 const [refresh,setRefresh]=useState(0);
 const bookmarks=useNativeBookmarks();
 const recent=useRecentSearches();
 const savedPaths=useMemo(()=>new Set(bookmarks.items.map(item=>item.webPath)),[bookmarks.items]);
 useEffect(()=>{
  if(Platform.OS==="web")return;
  const listener=BackHandler.addEventListener("hardwareBackPress",()=>{
   if(detail){setDetail(null);return true;}
   if(tab!=="home"){setTab("home");Keyboard.dismiss();return true;}
   return false;
  });
  return ()=>listener.remove();
 },[detail,tab]);
 function openSite(path:string){
  const target=firstPartyUrl(path);
  if(!target){Alert.alert("Link unavailable","Only official GTH PRO destinations are supported.");return;}
  Alert.alert("Continue to GTH PRO","This opens the existing verified website service. Bookings, payments and provider details are confirmed there.",[
   {text:"Stay in app",style:"cancel"},
   {text:"Continue",onPress:()=>{void Linking.openURL(target).catch(()=>Alert.alert("Unable to open link","Check your connection and try again."));}},
  ]);
 }
 async function shareRecord(item:DiscoveryCard){
  if(!item.webPath)return;
  const url=firstPartyUrl(item.webPath);
  if(!url)return;
  try{
   await Share.share({
    title:item.title,
    message:item.title+" · GTH PRO source record\n"+url,
   });
  }catch{
   Alert.alert("Sharing unavailable","Your phone could not open the share sheet.");
  }
 }
 function enterSearch(preferred:NativeChoice="all",input=query){
  const cleaned=normalizeQuery(input);
  Keyboard.dismiss();
  const detected=detectPillar(cleaned);
  const category=preferred!=="all"?preferred:detected;
  if(cleaned.length>=2)recent.remember(cleaned);
  setTerm(cleaned);setQuery(cleaned);setKind(category);setDetail(null);setTab("discover");
 }
 function openPillar(pillar:Pillar){
  setTab("discover");setTerm("");setQuery("");setKind(pillar);setDetail(null);
 }
 useEffect(()=>{
  if(tab!=="discover"||((kind==="all"||kind==="travel")&&!term.trim())){
   setResults([]);setTotal(0);setSlices([]);setWarnings([]);setPending(false);setError("");
   return;
  }
  const ctrl=new AbortController();
  const timer=setTimeout(()=>ctrl.abort(),11_000);
  let mounted=true;
  setPending(true);setError("");setResults([]);setSlices([]);setWarnings([]);
  searchNativeSources(kind,term,ctrl.signal).then(data=>{
   if(!mounted)return;
   setResults(data.items);setTotal(data.total);setSlices(data.slices);setWarnings(data.warnings);
   if(data.slices.every(s=>s.error))
    setError("The published sources are temporarily unavailable. Please retry.");
  }).catch(()=>{
   if(mounted)setError("Unable to load these records. Check your connection and retry.");
  }).finally(()=>{clearTimeout(timer);if(mounted)setPending(false);});
  return ()=>{mounted=false;clearTimeout(timer);ctrl.abort();};
 },[tab,kind,term,refresh]);
 const activeItem=detail;
 return <SafeAreaView edges={["top","left","right"]} style={{flex:1,backgroundColor:theme.bg}}>
  <StatusBar barStyle={dark?"light-content":"dark-content"} backgroundColor={theme.bg}/>
  <Header theme={theme} openSaved={()=>{setTab("saved");setDetail(null);}}/>
  <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingHorizontal:18,paddingBottom:28}}
   style={{flex:1}} key={tab+(activeItem?"-detail":"")}>
   {activeItem?<>
    <Pressable onPress={()=>setDetail(null)} accessibilityRole="button" accessibilityLabel="Back to results"
     style={{flexDirection:"row",alignItems:"center",gap:8,minHeight:50}}>
     <ArrowLeft size={19} color={theme.accent}/><Text style={{color:theme.accent,fontWeight:"800"}}>Back to {tab==="saved"?"saved records":"results"}</Text>
    </Pressable>
    <View style={[styles.detail,{backgroundColor:theme.surface,borderColor:theme.border}]}>
     {activeItem.image&&<Image source={{uri:activeItem.image}} resizeMode="cover"
       accessibilityLabel={activeItem.title} style={{height:180,width:"100%",borderRadius:15,marginBottom:18}}/>}
     <TextLabel text={activeItem.kind+" · SOURCE RECORD"} theme={theme}/>
     <Text style={[styles.h1,{color:theme.text,marginTop:9}]}>{activeItem.title}</Text>
     <Text style={[styles.lead,{color:theme.muted}]}>{activeItem.subtitle}</Text>
     <Text style={{fontSize:13,color:theme.muted,marginTop:8}}>Source: {activeItem.source}</Text>
     {activeItem.tag&&<Text style={{fontSize:12,color:theme.accent,marginTop:8}}>{activeItem.tag}</Text>}
     <View style={[styles.info,{borderColor:theme.border,backgroundColor:theme.surfaceSoft}]}>
      <ShieldCheck size={19} color={theme.accent}/>
      <Text style={{flex:1,fontSize:12,lineHeight:19,color:theme.muted}}>
       This is a public source record, not a guaranteed booking, approved property transaction or confirmed tender eligibility. Verify all current details with the original provider.
      </Text>
     </View>
     {activeItem.webPath?
      <Action label="Open original record" theme={theme} onPress={()=>openSite(activeItem.webPath!)}/>:
      <Action label="Open original service" theme={theme} onPress={()=>openSite(serviceDestination[activeItem.kind])}/>}
     {activeItem.webPath&&<View style={{marginTop:12,gap:10}}>
      <Action label={savedPaths.has(activeItem.webPath)?"Remove from saved":"Save to my desk"} theme={theme} secondary
       onPress={()=>savedPaths.has(activeItem.webPath!)?bookmarks.remove(activeItem.webPath!):bookmarks.save(activeItem)}/>
      <Pressable accessibilityRole="button" accessibilityLabel={"Share public record "+activeItem.title}
       onPress={()=>void shareRecord(activeItem)} style={[styles.action,{backgroundColor:theme.surfaceSoft}]}>
       <Share2 size={17} color={theme.text}/>
       <Text style={{fontSize:13,fontWeight:"800",color:theme.text}}>Share public record</Text>
      </Pressable>
     </View>}
    </View>
   </>:tab==="home"?<>
    <Hero theme={theme} query={query} setQuery={setQuery} onSearch={()=>enterSearch("all")} onQuick={q=>enterSearch("all",q)} onExplore={()=>{setTab("discover");setKind("all");setTerm("");}}/>
    {recent.ready&&recent.items.length>0&&<View style={[styles.recent,{backgroundColor:theme.surface,borderColor:theme.border}]}>
     <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:12}}>
      <View style={{flexDirection:"row",alignItems:"center",gap:8}}>
       <Clock3 size={17} color={theme.accent}/>
       <Text style={{fontSize:13,fontWeight:"800",color:theme.text}}>Continue searching</Text>
      </View>
      <Pressable onPress={recent.clear} accessibilityRole="button" accessibilityLabel="Clear recent searches"
       style={{minHeight:44,justifyContent:"center",paddingHorizontal:8}}>
       <Text style={{fontSize:12,fontWeight:"700",color:theme.muted}}>Clear</Text>
      </Pressable>
     </View>
     <ScrollView horizontal showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="always" contentContainerStyle={{gap:8,paddingBottom:2}}>
      {recent.items.map(item=><Pressable key={item} accessibilityRole="button"
       accessibilityLabel={"Repeat search "+item} onPress={()=>enterSearch("all",item)}
       style={[styles.chip,{backgroundColor:theme.surfaceSoft,borderColor:theme.border,minHeight:42}]}>
       <Text style={{fontSize:12,fontWeight:"700",color:theme.text}}>{item}</Text>
      </Pressable>)}
     </ScrollView>
     <Text style={{fontSize:10,lineHeight:15,color:theme.muted}}>Only on this device · clear any time</Text>
    </View>}
    <Journey theme={theme} onOpen={openPillar}/>
    <View style={[styles.info,{marginTop:24,backgroundColor:theme.surface,borderColor:theme.border}]}>
     <Bookmark size={22} color={theme.accent}/>
     <View style={{flex:1}}><Text style={{color:theme.text,fontWeight:"800"}}>Your Research Desk</Text>
      <Text style={{color:theme.muted,fontSize:12,marginTop:4}}>
       {bookmarks.ready&&bookmarks.items.length?bookmarks.items.length+" saved source records on this device":"Save real discoveries to revisit them anytime."}
      </Text></View>
     <Pressable onPress={()=>setTab("saved")} accessibilityRole="button" accessibilityLabel="Open Research Desk">
      <ArrowRight color={theme.accent} size={22}/>
     </Pressable>
    </View>
    <View style={{marginTop:24,gap:10}}>
     <TextLabel theme={theme} text="YOUR EVERYDAY SHORTCUTS"/>
     <Text style={[styles.sectionTitle,{color:theme.text}]}>Everything, one tap away.</Text>
     <View style={{flexDirection:"row",flexWrap:"wrap",gap:12}}>
      {serviceLinks.slice(0,4).map(item=><Pressable key={item.label}
        onPress={()=>item.mode==="native"?openPillar(item.kind):openSite(item.path)}
        accessibilityRole="button" accessibilityLabel={"Open "+item.label}
        style={({pressed})=>[styles.quickTile,{backgroundColor:theme.surface,borderColor:theme.border,opacity:pressed?.84:1}]}>
        <View style={{width:42,height:42,borderRadius:14,alignItems:"center",justifyContent:"center",backgroundColor:theme.surfaceSoft}}>
         {item.kind==="travel"?<Plane size={24} color={theme.accent}/>:
          item.kind==="hotel"?<Hotel size={24} color={theme.accent}/>:
          item.kind==="property"?<Building2 size={24} color={theme.accent}/>:
          <FileText size={24} color={theme.accent}/>}
        </View>
        <View style={{flexDirection:"row",alignItems:"center",gap:4}}>
         <Text numberOfLines={1} style={{flex:1,color:theme.text,fontSize:13,fontWeight:"800"}}>{item.label}</Text>
         <ArrowRight size={15} color={theme.accent}/>
        </View>
        <Text numberOfLines={2} style={{fontSize:11,lineHeight:16,color:theme.muted}}>{item.description}</Text>
       </Pressable>)}
     </View>
    </View>
   </>:tab==="discover"?<>
    <View style={{paddingTop:12}}>
     <TextLabel theme={theme} text="SEARCH THE GLOBAL ECOSYSTEM"/>
     <Text style={[styles.sectionTitle,{color:theme.text,marginTop:6}]}>Discover what matters.</Text>
     <View style={[styles.searchRow,{backgroundColor:theme.surface,borderColor:theme.border,marginTop:13}]}>
      <Search size={20} color={theme.accent}/>
      <TextInput value={query} onChangeText={setQuery} onSubmitEditing={()=>enterSearch(kind)}
       returnKeyType="search" accessibilityLabel="Search source records" autoCorrect={false}
       placeholder="Search a city, project or notice…" placeholderTextColor={theme.muted}
       style={[styles.searchInput,{color:theme.text}]}/>
      <Pressable accessibilityRole="button" accessibilityLabel="Submit source search" onPress={()=>enterSearch(kind)}
       style={[styles.searchGo,{backgroundColor:theme.accent}]}><ArrowRight size={20} color={theme.onAccent}/></Pressable>
     </View>
     <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8,paddingVertical:15}}>
      {filters.map(filter=><Pressable key={filter.kind} accessibilityRole="button"
        accessibilityState={{selected:kind===filter.kind}}
        onPress={()=>{setKind(filter.kind);setTerm(normalizeQuery(query));}}
        style={[styles.chip,{borderColor:kind===filter.kind?theme.accent:theme.border,backgroundColor:theme.surface}]}>
       <Text style={{fontSize:12,fontWeight:"800",color:kind===filter.kind?theme.accent:theme.text}}>{filter.title}</Text>
      </Pressable>)}
     </ScrollView>
     {kind==="all"&&!term&&recent.ready&&recent.items.length>0&&<View style={{gap:9,paddingBottom:14}}>
      <Text style={{fontSize:12,fontWeight:"800",color:theme.muted}}>Your recent searches</Text>
      {recent.items.slice(0,5).map(item=><Pressable key={item} onPress={()=>enterSearch("all",item)}
       accessibilityRole="button" accessibilityLabel={"Repeat search "+item}
       style={[styles.serviceRow,{backgroundColor:theme.surface,borderColor:theme.border,marginBottom:0}]}>
       <Clock3 size={18} color={theme.accent}/>
       <Text style={{color:theme.text,fontSize:13,fontWeight:"700",flex:1}} numberOfLines={1}>{item}</Text>
       <ArrowRight size={17} color={theme.accent}/>
      </Pressable>)}
     </View>}
    </View>
    {kind==="all"&&!term?<View style={[styles.empty,{borderColor:theme.border,backgroundColor:theme.surface}]}>
      <Compass size={32} color={theme.accent}/>
      <Text style={[styles.sectionTitle,{color:theme.text,textAlign:"center"}]}>One search. Trusted specialist sources.</Text>
      <Text style={{textAlign:"center",lineHeight:20,fontSize:13,color:theme.muted}}>Try Goa, Mumbai, a project or a tender keyword. Search combines existing public sources without creating duplicate inventory.</Text>
     </View>:kind==="travel"?<View style={[styles.empty,{borderColor:theme.border,backgroundColor:theme.surface}]}>
      <Plane size={33} color={theme.accent}/>
      <Text style={[styles.sectionTitle,{color:theme.text,textAlign:"center"}]}>Where to next?</Text>
      <Text style={{textAlign:"center",fontSize:12,color:theme.muted}}>Flight fares require an origin, destination and travel dates. Continue to the existing search.</Text>
      <View style={{width:"100%",gap:10}}>
       <Action label="Explore hotels & stays" theme={theme} onPress={()=>{setKind("hotel");setTerm("");}}/>
       <Action label="Discover tours & activities" theme={theme} secondary onPress={()=>{setKind("tour");setTerm("");}}/>
       <Action label="Search flights on GTH PRO" theme={theme} secondary onPress={()=>openSite("/app/flights")}/>
      </View>
     </View>:<>
      <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
       <Text style={{color:theme.text,fontSize:17,fontWeight:"800"}}>{kind==="all"?"Across the GTH PRO ecosystem":kind==="hotel"?"Stays & hotels":kind==="property"?"Property research":kind==="tender"?"Public tenders":"Experiences"}</Text>
       <Text style={{color:theme.muted,fontSize:11}}>{pending?"Searching":total+" source matches"}</Text>
      </View>
      {kind==="all"&&slices.length>0&&<ScrollView horizontal showsHorizontalScrollIndicator={false}
       contentContainerStyle={{gap:8,marginBottom:12}}>
       {slices.map(slice=><Pressable key={slice.kind} accessibilityRole="button"
         accessibilityLabel={slice.kind+" "+slice.total+" matches"}
         onPress={()=>{setKind(slice.kind);setTerm(normalizeQuery(query));}}
         style={[styles.chip,{borderColor:theme.border,backgroundColor:theme.surface}]}>
         <Text style={{color:theme.text,fontSize:12,fontWeight:"700"}}>
          {slice.kind==="hotel"?"Hotels":slice.kind==="property"?"Property":slice.kind==="tender"?"Tenders":"Tours"} · {slice.total}
         </Text>
        </Pressable>)}
       </ScrollView>}
      {warnings.length>0&&!pending&&<View accessibilityRole="alert" style={[styles.info,{backgroundColor:theme.surface,borderColor:theme.border,marginBottom:12}]}>
       <ShieldCheck color={theme.accent} size={18}/>
       <Text style={{fontSize:12,lineHeight:18,flex:1,color:theme.muted}}>
        {warnings.length} {warnings.length===1?"source is":"sources are"} unavailable. Available results remain visible.
       </Text>
      </View>}
      {pending&&<View accessibilityLiveRegion="polite" style={{padding:20,gap:12}}>
       <ActivityIndicator color={theme.accent} accessibilityLabel="Loading source records"/>
       {[0,1,2].map(i=><View key={i} style={{height:76,borderRadius:16,backgroundColor:theme.surface,borderWidth:1,borderColor:theme.border}}/>)}
      </View>}
      {!!error&&<View style={[styles.info,{backgroundColor:theme.surface,borderColor:theme.border}]}>
       <Text style={{flex:1,color:theme.muted,fontSize:12}}>{error}</Text>
       <Pressable accessibilityRole="button" onPress={()=>setRefresh(v=>v+1)}><Text style={{color:theme.accent,fontWeight:"800"}}>Retry</Text></Pressable>
      </View>}
      {!pending&&!error&&results.length===0&&<View style={[styles.empty,{backgroundColor:theme.surface,borderColor:theme.border}]}>
       <Search color={theme.accent} size={28}/>
       <Text style={{color:theme.text,fontSize:16,fontWeight:"800"}}>No published results found</Text>
       <Text style={{color:theme.muted,textAlign:"center",fontSize:12,lineHeight:18}}>Try another city or term. GTH PRO never fabricates availability or records.</Text>
      </View>}
      {results.map((item,index)=><RecordCard key={item.id+"-"+index} theme={theme} item={item}
       bookmarked={!!item.webPath&&savedPaths.has(item.webPath)}
       onToggle={()=>item.webPath&&(savedPaths.has(item.webPath)?bookmarks.remove(item.webPath):bookmarks.save(item))}
       onOpen={()=>setDetail(item)}/>)}
      <Text style={{marginTop:12,color:theme.muted,fontSize:11,lineHeight:17}}>
       Results come from existing public GTH PRO APIs. Open original details to confirm sources, prices, deadlines or provider availability.
      </Text>
     </>}
   </>:tab==="saved"?<>
    <View style={{paddingTop:13,marginBottom:12}}>
     <TextLabel theme={theme} text="YOUR PRIVATE SPACE"/>
     <Text style={[styles.sectionTitle,{color:theme.text,marginTop:6}]}>My Research Desk</Text>
     <Text style={{fontSize:12,color:theme.muted,marginTop:5}}>Saved only on this phone · no account sync or automatic sharing</Text>
    </View>
    {!bookmarks.ready&&<ActivityIndicator color={theme.accent}/>}
    {bookmarks.ready&&bookmarks.items.length===0&&<View style={[styles.empty,{borderColor:theme.border,backgroundColor:theme.surface}]}>
     <Bookmark size={36} color={theme.accent}/>
     <Text style={[styles.sectionTitle,{color:theme.text}]}>Your next discovery belongs here.</Text>
     <Text style={{fontSize:12,lineHeight:19,textAlign:"center",color:theme.muted}}>Save an original hotel, property or tender record to revisit it without searching again.</Text>
     <Action label="Start exploring" theme={theme} onPress={()=>setTab("discover")}/>
    </View>}
    {bookmarks.items.map((item,index)=><RecordCard key={item.id+"-"+index} theme={theme} item={item} bookmarked
     onOpen={()=>setDetail(item)} onToggle={()=>item.webPath&&bookmarks.remove(item.webPath)}/>)}
   </>:<>
    <View style={{paddingTop:13,marginBottom:12}}>
     <TextLabel theme={theme} text="ALL THREE ECOSYSTEMS"/>
     <Text style={[styles.sectionTitle,{color:theme.text,marginTop:6}]}>Explore every service</Text>
     <Text style={{fontSize:12,lineHeight:19,color:theme.muted,marginTop:5}}>Native browsing first. Original booking, registry and tender actions when you choose them.</Text>
    </View>
    {serviceLinks.map(item=><Pressable key={item.label} onPress={()=>item.mode==="native"?openPillar(item.kind):openSite(item.path)}
     accessibilityRole="button" style={[styles.serviceRow,{backgroundColor:theme.surface,borderColor:theme.border}]}>
     {item.kind==="travel"?<Plane size={24} color={theme.accent}/>:
      item.kind==="hotel"?<Hotel size={24} color={theme.accent}/>:
      item.kind==="property"?<Building2 size={24} color={theme.accent}/>:
      item.kind==="tender"?<FileText size={24} color={theme.accent}/>:
      <Compass size={24} color={theme.accent}/>}
     <View style={{flex:1}}><Text style={{fontSize:14,fontWeight:"800",color:theme.text}}>{item.label}</Text>
      <Text style={{fontSize:11,lineHeight:17,color:theme.muted}}>{item.description}</Text>
     </View>
     <ExternalLink size={18} color={theme.muted}/>
    </Pressable>)}
    <View style={[styles.info,{backgroundColor:theme.surface,borderColor:theme.border,marginTop:15}]}>
     <ShieldCheck size={22} color={theme.accent}/>
     <Text style={{flex:1,color:theme.muted,lineHeight:18,fontSize:12}}>
      GTH PRO respects original sources. We do not claim live prices, supplier bookings or tender eligibility without confirmation.
     </Text>
    </View>
   </>}
  </ScrollView>
  <BottomBar tab={tab} setTab={next=>{setTab(next);setDetail(null);}} theme={theme}/>
 </SafeAreaView>;
}
export default function App(){return <SafeAreaProvider><NativeApp/></SafeAreaProvider>;}

const styles=StyleSheet.create({
 header:{height:65,paddingHorizontal:18,borderBottomWidth:1,alignItems:"center",flexDirection:"row",justifyContent:"space-between"},
 brandMark:{width:43,height:43,borderRadius:15,borderWidth:1.25,alignItems:"center",justifyContent:"center"},
 brandName:{fontSize:18,fontWeight:"900",letterSpacing:0.4},
 roundIcon:{height:44,width:44,borderWidth:1,borderRadius:14,alignItems:"center",justifyContent:"center"},
 eyebrow:{fontSize:10,fontWeight:"900",letterSpacing:1.5},
 hero:{marginTop:17,padding:18,borderWidth:1,borderRadius:26},
 h1:{fontSize:31,lineHeight:36,fontWeight:"900",letterSpacing:-0.7},
 lead:{fontSize:13,lineHeight:21,marginTop:9},
 searchRow:{borderWidth:1,borderRadius:15,minHeight:55,flexDirection:"row",alignItems:"center",paddingLeft:12,paddingRight:5,marginTop:18,gap:9},
 searchInput:{height:45,flex:1,fontSize:13,minWidth:0},
 searchGo:{width:43,height:43,alignItems:"center",justifyContent:"center",borderRadius:12},
 sectionTitle:{fontSize:20,fontWeight:"900",marginTop:5,letterSpacing:-0.3},
 journeyCard:{width:255,borderRadius:19,borderWidth:1,overflow:"hidden"},
 journeyBadge:{height:36,width:36,alignItems:"center",justifyContent:"center",borderRadius:12},
 info:{padding:15,borderRadius:17,borderWidth:1,flexDirection:"row",alignItems:"center",gap:12},
 serviceRow:{minHeight:65,padding:12,borderRadius:15,borderWidth:1,flexDirection:"row",alignItems:"center",gap:13,marginBottom:9},
 recent:{borderWidth:1,borderRadius:18,marginTop:14,paddingHorizontal:14,paddingVertical:8,gap:4},
 quickTile:{width:"47%",minHeight:140,flexGrow:1,maxWidth:"49%",padding:13,borderRadius:18,borderWidth:1,justifyContent:"space-between",gap:9},
 tabbar:{height:57,flexDirection:"row",alignItems:"center",justifyContent:"space-around"},
 tab:{height:55,flex:1,alignItems:"center",justifyContent:"center",gap:3},
 chip:{borderWidth:1,paddingHorizontal:14,minHeight:42,borderRadius:24,alignItems:"center",justifyContent:"center"},
 record:{padding:12,borderWidth:1,borderRadius:17,marginBottom:10,flexDirection:"row",alignItems:"center",gap:8},
 recordIcon:{height:64,width:64,borderRadius:14,alignItems:"center",justifyContent:"center",overflow:"hidden"},
 bookmarkButton:{width:44,height:44,borderRadius:13,borderWidth:1,alignItems:"center",justifyContent:"center"},
 empty:{padding:23,borderWidth:1,borderRadius:20,alignItems:"center",gap:13,marginTop:8},
 detail:{padding:20,borderWidth:1,borderRadius:21,marginTop:5},
 action:{minHeight:47,borderRadius:13,paddingHorizontal:15,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:9},
});
