import React,{useEffect,useMemo,useState} from "react";
import {
 ActivityIndicator,Alert,BackHandler,FlatList,Image,ImageBackground,Keyboard,Linking,Pressable,
 Platform,ScrollView,Share,StatusBar,StyleSheet,Text,TextInput,useColorScheme,View,type ImageSourcePropType,
} from "react-native";
import {SafeAreaProvider,SafeAreaView} from "react-native-safe-area-context";
import {
 ArrowLeft,ArrowRight,Bookmark,BookmarkCheck,Building2,Clock3,Compass,
 FileText,Home,Hotel,MapPin,Plane,Search,Settings,Share2,ShieldCheck,
} from "lucide-react-native";
import colors from "./theme/generated.json";
import travelHero from "../assets/hero/travel.jpg";
import propertyHero from "../assets/hero/property.jpg";
import tenderHero from "../assets/hero/tender.jpg";
import brandLogo from "../assets/branding/logo.png";
import {approvedCreditUrl,type DiscoveryCard,type DiscoveryKind} from "./core/catalog";
import {useNativeDiscovery} from "./core/use-discovery";
import {useAppearance} from "./core/appearance";
import {ConfirmationDialog,SettingsDialog,type Confirmation} from "./components/NativeDialogs";
import {detectPillar,firstPartyUrl,normalizeQuery,queryForCategory,serviceDestination,type Pillar} from "./core/routing";
import {useNativeBookmarks} from "./core/bookmarks";
import {useRecentSearches} from "./core/recent-searches";
import {bookingServiceForQuery,SERVICES as serviceLinks} from "./core/services";
import ServicesHub,{ServiceIcon} from "./components/ServicesHub";
import {PhotoCreditLine,SourcePhoto} from "./components/SourcePhoto";
import ResearchNotebook from "./components/ResearchNotebook";

type Theme=typeof colors.light;
type Tab="home"|"discover"|"saved"|"services";
type NativeChoice=DiscoveryKind|"all"|"travel";
const filters:{kind:NativeChoice;title:string}[]=[
 {kind:"all",title:"All"},{kind:"travel",title:"Travel"},{kind:"hotel",title:"Hotels"},{kind:"property",title:"Property"},
 {kind:"tender",title:"Tenders"},{kind:"tour",title:"Tours"},
];
const tenderRegions=[
 {code:"IN",label:"India"},{code:"WORLD",label:"Worldwide"},
 {code:"US",label:"United States"},{code:"GB",label:"United Kingdom"},
 {code:"AE",label:"UAE"},{code:"SG",label:"Singapore"},
 {code:"AU",label:"Australia"},
] as const;
const panel:{kind:Pillar;heading:string;caption:string;image:ImageSourcePropType}[]=[
 {kind:"travel",heading:"Go further.",caption:"Flights, destinations and experiences.",image:travelHero},
 {kind:"property",heading:"Find your place.",caption:"Explore property and registry records.",image:propertyHero},
 {kind:"tender",heading:"Build what is next.",caption:"Find published business opportunities.",image:tenderHero},
];

function TextLabel({text,theme}:{text:string;theme:Theme}){
 return <Text style={[styles.eyebrow,{color:theme.accentText}]}>{text.toUpperCase()}</Text>;
}
function Action({label,onPress,theme,secondary=false}:{label:string;onPress:()=>void;theme:Theme;secondary?:boolean}){
 return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}
  style={({pressed})=>[styles.action,{backgroundColor:secondary?theme.surfaceSoft:theme.accent,opacity:pressed?0.78:1}]}>
  <Text style={{fontSize:13,fontWeight:"800",color:secondary?theme.text:theme.onAccent}}>{label}</Text>
  <ArrowRight size={16} color={secondary?theme.text:theme.onAccent}/>
 </Pressable>;
}
function Header({theme,openSettings}:{theme:Theme;openSettings:()=>void}){
 return <View style={[styles.header,{borderColor:theme.border}]}>
  <View style={{flexDirection:"row",alignItems:"center",gap:9}}>
   <View style={[styles.brandMark,{borderColor:theme.accent}]}><Image source={brandLogo} resizeMode="cover" accessibilityLabel="GTH PRO logo" style={{width:37,height:37,borderRadius:11}}/></View>
   <View><Text style={[styles.brandName,{color:theme.text}]}>GTH <Text style={{color:theme.accentText}}>PRO</Text></Text>
    <Text style={{fontSize:10,color:theme.muted}}>THE GLOBAL EXPERIENCE</Text>
   </View>
  </View>
  <Pressable accessibilityRole="button" accessibilityLabel="Open app settings" onPress={openSettings}
   style={[styles.roundIcon,{backgroundColor:theme.surface,borderColor:theme.border}]}>
   <Settings size={20} color={theme.accentText}/>
  </Pressable>
 </View>;
}
function Hero({theme,onSearch,onQuick,query,setQuery}:{theme:Theme;onSearch:()=>void;onQuick:(query:string)=>void;query:string;setQuery:(v:string)=>void}){
 return <View style={[styles.hero,{backgroundColor:theme.surface,borderColor:theme.border}]}>
  <Text style={[styles.h1,{color:theme.text}]}>Your world. All in one place.</Text>
  <Text style={[styles.lead,{color:theme.muted}]}>Travel · Real Estate · Tenders</Text>
  <View style={[styles.searchRow,{backgroundColor:theme.bg,borderColor:theme.border}]}>
   <Search size={20} color={theme.accentText}/>
   <TextInput placeholder="Search GTH PRO" multiline={false} numberOfLines={1}
    placeholderTextColor={theme.muted} value={query} onChangeText={setQuery}
    onSubmitEditing={onSearch} returnKeyType="search" autoCorrect={false}
    accessibilityLabel="Universal search" style={[styles.searchInput,{color:theme.text}]}/>
   <Pressable onPress={onSearch} accessibilityRole="button" accessibilityLabel="Search GTH PRO"
    style={[styles.searchGo,{backgroundColor:theme.accent}]}>
    <ArrowRight size={21} color={theme.onAccent}/>
   </Pressable>
  </View>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled"
   contentContainerStyle={{gap:8,paddingTop:10,paddingBottom:2,alignItems:"center"}}>
   {[{q:"Goa hotels",label:"Goa hotels"},{q:"Mumbai property",label:"Mumbai homes"},{q:"construction tender",label:"Tenders"}].map(item=>
    <Pressable key={item.q} accessibilityRole="button" accessibilityLabel={"Search "+item.q}
     onPress={()=>onQuick(item.q)} style={[styles.chip,{backgroundColor:theme.surfaceSoft,borderColor:theme.border,minHeight:44,paddingHorizontal:12}]}>
     <Text style={{fontSize:11,fontWeight:"700",color:theme.text}}>{item.label}</Text>
    </Pressable>)}
  </ScrollView>
 </View>;
}
function ServiceShortcuts({theme,onOpen,onExplore}:{theme:Theme;onOpen:(item:typeof serviceLinks[number])=>void;onExplore:()=>void}){
 const entries=["Flights","Hotels","Tours & activities","Bus journeys","Train journeys","Ferry journeys","Real Estate","Public tenders"]
  .flatMap(label=>serviceLinks.filter(item=>item.label===label));
 return <View style={{marginTop:18,gap:10}}>
  <Text style={[styles.sectionTitle,{color:theme.text}]}>What would you like to do?</Text>
  <View style={styles.shortcutGrid}>
   {entries.map(item=>{
    const label=item.label.replace(" journeys","").replace("Public tenders","Tenders").replace("Tours & activities","Tours");
    return <Pressable key={item.label} onPress={()=>onOpen(item)} accessibilityRole="button" accessibilityLabel={"Open "+item.label}
     style={({pressed})=>[styles.quickTile,{backgroundColor:theme.surface,borderColor:theme.border,opacity:pressed?.84:1}]}>
     <ServiceIcon service={item} theme={theme}/>
     <Text style={{color:theme.text,fontSize:12,fontWeight:"800",textAlign:"center"}}>{label}</Text>
    </Pressable>;
   })}
   <Pressable onPress={onExplore} accessibilityRole="button" accessibilityLabel="Explore all services"
    style={[styles.quickTile,{backgroundColor:theme.surfaceSoft,borderColor:theme.border}]}>
    <Compass size={23} color={theme.accentText}/>
    <Text style={{color:theme.text,fontSize:12,fontWeight:"800",textAlign:"center"}}>All services</Text>
   </Pressable>
  </View>
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
      {card.kind==="travel"?<Plane size={17} color={theme.accentText}/>:
       card.kind==="property"?<Building2 size={17} color={theme.accentText}/>:
       <FileText size={17} color={theme.accentText}/>}
     </View>
    </ImageBackground>
    <View style={{padding:14,gap:5}}>
     <Text style={{fontSize:18,fontWeight:"800",color:theme.text}}>{card.heading}</Text>
     <Text style={{fontSize:12,lineHeight:18,color:theme.muted}}>{card.caption}</Text>
     <View style={{flexDirection:"row",alignItems:"center",gap:6,marginTop:4}}>
      <Text style={{color:theme.accentText,fontSize:12,fontWeight:"800"}}>Discover</Text>
      <ArrowRight size={15} color={theme.accentText}/>
     </View>
    </View>
   </Pressable>)}
  </ScrollView>
 </View>;
}
function RecordCard({item,theme,bookmarked,onOpen,onToggle,onCredit}:{item:DiscoveryCard;theme:Theme;bookmarked:boolean;onOpen:()=>void;onToggle:()=>void;onCredit:(kind:"page"|"license")=>void}){
 return <View style={[styles.record,{backgroundColor:theme.surface,borderColor:theme.border}]}>
  <View style={{flexDirection:"row",alignItems:"center",gap:8}}>
  <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={"Details for "+item.title}
   style={{flexDirection:"row",alignItems:"center",gap:12,flex:1}}>
   <View style={[styles.recordIcon,{backgroundColor:theme.surfaceSoft}]}>
    {item.image?<SourcePhoto item={item} theme={theme}/>:
     item.kind==="hotel"?<Hotel size={25} color={theme.accentText}/>:
     item.kind==="property"?<Building2 size={25} color={theme.accentText}/>:
     item.kind==="tender"?<FileText size={25} color={theme.accentText}/>:
     <MapPin size={25} color={theme.accentText}/>}
   </View>
   <View style={{flex:1,gap:4}}>
    <Text numberOfLines={2} style={{fontSize:14,fontWeight:"800",color:theme.text}}>{item.title}</Text>
    <Text numberOfLines={1} style={{fontSize:12,color:theme.muted}}>{item.subtitle}</Text>
    <Text numberOfLines={1} style={{fontSize:11,color:theme.accentText}}>{item.tag||item.source}</Text>
   </View>
   <ArrowRight size={18} color={theme.muted}/>
  </Pressable>
  {item.webPath&&<Pressable onPress={onToggle} accessibilityRole="button"
    accessibilityLabel={(bookmarked?"Remove saved ":"Save ")+item.title} accessibilityState={{selected:bookmarked}}
    aria-pressed={bookmarked}
    style={[styles.bookmarkButton,{borderColor:theme.border}]}>
    {bookmarked?<BookmarkCheck size={19} color={theme.accentText}/>:<Bookmark size={19} color={theme.muted}/>}
   </Pressable>}
  </View>
  <PhotoCreditLine item={item} theme={theme} compact onOpen={onCredit}/>
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
    aria-selected={tab===id}
    accessibilityLabel={title+" tab"} style={[styles.tab,tab===id&&{backgroundColor:theme.surfaceSoft,borderTopColor:theme.accent,borderTopWidth:2}]}>
    <Icon size={22} color={tab===id?theme.accentText:theme.muted} strokeWidth={tab===id?2.5:1.7}/>
    <Text style={{fontSize:11,fontWeight:tab===id?"800":"600",color:tab===id?theme.accentText:theme.muted}}>{title}</Text>
   </Pressable>)}</View>
 </SafeAreaView>;
}
function NativeApp(){
 const systemDark=useColorScheme()==="dark";
 const appearance=useAppearance(systemDark);
 const dark=appearance.dark;
 const [settingsOpen,setSettingsOpen]=useState(false);
 const [confirmation,setConfirmation]=useState<Confirmation|null>(null);
 const theme=dark?colors.dark:colors.light;
 const [tab,setTab]=useState<Tab>("home");
 const [query,setQuery]=useState("");
 const [term,setTerm]=useState("");
 const [kind,setKind]=useState<NativeChoice>("all");
 const [tenderRegion,setTenderRegion]=useState<string>("IN");
 const [detail,setDetail]=useState<DiscoveryCard|null>(null);
 const [savedKind,setSavedKind]=useState<DiscoveryKind|"all">("all");
 const discovery=useNativeDiscovery(kind,term,tenderRegion);
 const {items:results,slices,warnings,total,pending,error}=discovery;
 const bookmarks=useNativeBookmarks();
 const recent=useRecentSearches();
 const savedPaths=useMemo(()=>new Set(bookmarks.items.map(item=>item.webPath)),[bookmarks.items]);
 const savedItems=bookmarks.items.filter(item=>savedKind==="all"||item.kind===savedKind);
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
  setSettingsOpen(false);
  setConfirmation({title:"Continue to GTH PRO",message:"This opens the GTH PRO website service. Confirm current booking, payment and provider details there.",confirmLabel:"Continue",
   action:()=>Linking.openURL(target)});
 }
 function openPhotoCredit(item:DiscoveryCard,kind:"page"|"license"){
  const target=approvedCreditUrl(kind==="page"?item.photoCredit?.page:item.photoCredit?.licenseUrl);
  if(!target)return;
  setConfirmation({title:"Photo credits",message:"This opens the published image source or license outside GTH PRO.",confirmLabel:"View photo credits",
   action:()=>Linking.openURL(target)});
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
  const service=(preferred==="all"||preferred==="travel")&&detected==="all"?bookingServiceForQuery(cleaned):undefined;
  if(service){
   setQuery(cleaned);
   const target=firstPartyUrl(service.path)!;
   setConfirmation({title:"Continue to "+service.label,message:"Open the existing GTH PRO search to choose your route, travel dates and passengers. Your search text does not confirm availability.",
    confirmLabel:"Open "+service.label,action:()=>Linking.openURL(target)});
   return;
  }
  if(category===kind&&cleaned===term)discovery.retry();
  setTerm(cleaned);setQuery(cleaned);setKind(category);setDetail(null);setTab("discover");
 }
 function openPillar(pillar:Pillar){
  setTab("discover");setTerm("");setQuery("");setKind(pillar);setDetail(null);
 }
 function clearDeviceData(type:"saved"|"history"){
  setSettingsOpen(false);
  setConfirmation({title:type==="saved"?"Clear saved records?":"Clear search history?",
   message:"This removes the selected data from this device only. This action cannot be undone.",confirmLabel:"Clear from this device",
   action:()=>{if(type==="saved"){bookmarks.clear();setSavedKind("all");setDetail(null);}else recent.clear();}});
 }
 const activeItem=detail;
 const savedItem=activeItem?bookmarks.items.find(item=>item.webPath&&item.webPath===activeItem.webPath):undefined;
 const resultView=tab==="discover"&&(!["all","travel"].includes(kind)||!!term);
 const visibleRecords=activeItem?[]:resultView?results:tab==="saved"?savedItems:[];
 return <SafeAreaView edges={["top","left","right"]} style={{flex:1,backgroundColor:theme.bg}}>
  <StatusBar barStyle={dark?"light-content":"dark-content"} backgroundColor={theme.bg}/>
  <Header theme={theme} openSettings={()=>setSettingsOpen(true)}/>
  {settingsOpen&&<SettingsDialog visible theme={theme} mode={appearance.mode} ready={appearance.ready}
   dataReady={bookmarks.ready&&recent.ready}
   onMode={appearance.select} onClose={()=>setSettingsOpen(false)} onClearSaved={()=>clearDeviceData("saved")}
   onClearHistory={()=>clearDeviceData("history")} onWebsite={openSite}/>}
  {confirmation&&<ConfirmationDialog request={confirmation} theme={theme} onClose={()=>setConfirmation(null)}/>}
  {(bookmarks.storageError||recent.storageError||appearance.storageError)&&<View accessibilityRole="alert"
    style={[styles.info,{margin:12,backgroundColor:theme.surface,borderColor:theme.border}]}>
   <Text style={{flex:1,fontSize:12,lineHeight:18,color:theme.muted}}>
    Device storage is unavailable. Changes may not persist. Restart to retry reading existing device data.
   </Text>
  </View>}
  <FlatList<DiscoveryCard> keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets contentContainerStyle={{paddingHorizontal:18,paddingBottom:28}}
   style={{flex:1}} key={tab+(activeItem?"-detail":"")} data={visibleRecords}
   initialNumToRender={8} maxToRenderPerBatch={8} windowSize={7}
   keyExtractor={item=>item.kind+":"+item.id}
   renderItem={({item})=><RecordCard theme={theme} item={item} bookmarked={!!item.webPath&&savedPaths.has(item.webPath)}
    onOpen={()=>setDetail(item)} onToggle={()=>item.webPath&&(savedPaths.has(item.webPath)?bookmarks.remove(item.webPath):bookmarks.save(item))}
    onCredit={kind=>openPhotoCredit(item,kind)}/>}
   ListHeaderComponent={<>
   {activeItem?<>
    <Pressable onPress={()=>setDetail(null)} accessibilityRole="button" accessibilityLabel="Back to results"
     style={{flexDirection:"row",alignItems:"center",gap:8,minHeight:50}}>
     <ArrowLeft size={19} color={theme.accentText}/><Text style={{color:theme.accentText,fontWeight:"800"}}>Back to {tab==="saved"?"saved records":"results"}</Text>
    </Pressable>
    <View style={[styles.detail,{backgroundColor:theme.surface,borderColor:theme.border}]}>
     {activeItem.image&&<View style={{marginBottom:18}}><SourcePhoto item={activeItem} theme={theme} large/>
      <PhotoCreditLine item={activeItem} theme={theme} onOpen={kind=>openPhotoCredit(activeItem,kind)}/></View>}
     <TextLabel text={activeItem.kind+" · SOURCE RECORD"} theme={theme}/>
     <Text style={[styles.h1,{color:theme.text,marginTop:9}]}>{activeItem.title}</Text>
     <Text style={[styles.lead,{color:theme.muted}]}>{activeItem.subtitle}</Text>
     <Text style={{fontSize:13,color:theme.muted,marginTop:8}}>Source: {activeItem.source}</Text>
     {activeItem.tag&&<Text style={{fontSize:12,color:theme.accentText,marginTop:8}}>{activeItem.tag}</Text>}
     {!!activeItem.facts?.length&&<View style={{gap:10,marginTop:20}}>
      <Text accessibilityRole="header" style={{color:theme.text,fontSize:17,fontWeight:"800"}}>At a glance</Text>
      <View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>
       {activeItem.facts.map(fact=><View key={fact.label} style={[styles.fact,{backgroundColor:theme.surfaceSoft}]}>
        <Text style={{color:theme.muted,fontSize:11,lineHeight:17}}>{fact.label}</Text>
        <Text style={{color:theme.text,fontSize:13,fontWeight:"700",lineHeight:20}}>{fact.value}</Text>
       </View>)}
      </View>
     </View>}
     <View style={[styles.info,{borderColor:theme.border,backgroundColor:theme.surfaceSoft}]}>
      <ShieldCheck size={19} color={theme.accentText}/>
      <Text style={{flex:1,fontSize:12,lineHeight:19,color:theme.muted}}>
       This is a public source record, not a guaranteed booking, approved property transaction or confirmed tender eligibility. Verify all current details with the original provider.
      </Text>
     </View>
     {activeItem.bookingPath&&<View style={{marginBottom:12}}><Action label="Check dates & availability" theme={theme}
      onPress={()=>openSite(activeItem.bookingPath!)}/></View>}
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
     {savedItem&&<ResearchNotebook key={savedItem.webPath} item={savedItem} theme={theme}
      onNote={note=>bookmarks.updateNote(savedItem.webPath!,note)} onCheck={id=>bookmarks.toggleCheck(savedItem.webPath!,id)}/>}
    </View>
   </>:tab==="home"?<>
    <Hero theme={theme} query={query} setQuery={setQuery} onSearch={()=>enterSearch("all")} onQuick={q=>enterSearch("all",q)}/>
    <ServiceShortcuts theme={theme} onOpen={item=>item.mode==="native"?openPillar(item.kind):openSite(item.path)} onExplore={()=>setTab("services")}/>
    {recent.ready&&recent.items.length>0&&<View style={[styles.recent,{backgroundColor:theme.surface,borderColor:theme.border}]}>
     <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:12}}>
      <View style={{flexDirection:"row",alignItems:"center",gap:8}}>
       <Clock3 size={17} color={theme.accentText}/>
       <Text style={{fontSize:13,fontWeight:"800",color:theme.text}}>Continue searching</Text>
      </View>
      <Pressable onPress={()=>clearDeviceData("history")} accessibilityRole="button" accessibilityLabel="Clear recent searches"
       style={{minHeight:44,justifyContent:"center",paddingHorizontal:8}}>
       <Text style={{fontSize:12,fontWeight:"700",color:theme.muted}}>Clear</Text>
      </Pressable>
     </View>
     <ScrollView horizontal showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="always" contentContainerStyle={{gap:8,paddingBottom:2}}>
      {recent.items.map(item=><Pressable key={item} accessibilityRole="button"
       accessibilityLabel={"Repeat search "+item} onPress={()=>enterSearch("all",item)}
       style={[styles.chip,{backgroundColor:theme.surfaceSoft,borderColor:theme.border,minHeight:44}]}>
       <Text style={{fontSize:12,fontWeight:"700",color:theme.text}}>{item}</Text>
      </Pressable>)}
     </ScrollView>
     <Text style={{fontSize:10,lineHeight:15,color:theme.muted}}>Only on this device · clear any time</Text>
    </View>}
    <Journey theme={theme} onOpen={openPillar}/>
    <View style={[styles.info,{marginTop:24,backgroundColor:theme.surface,borderColor:theme.border}]}>
     <Bookmark size={22} color={theme.accentText}/>
     <View style={{flex:1}}><Text style={{color:theme.text,fontWeight:"800"}}>Your Research Desk</Text>
      <Text style={{color:theme.muted,fontSize:12,marginTop:4}}>
       {bookmarks.ready&&bookmarks.items.length?bookmarks.items.length+" saved source records on this device":"Save real discoveries to revisit them anytime."}
      </Text></View>
     <Pressable onPress={()=>setTab("saved")} accessibilityRole="button" accessibilityLabel="Open Research Desk" style={{minWidth:44,minHeight:44,alignItems:"center",justifyContent:"center"}}>
      <ArrowRight color={theme.accentText} size={22}/>
     </Pressable>
    </View>
   </>:tab==="discover"?<>
    <View style={{paddingTop:12}}>
     <TextLabel theme={theme} text="SEARCH THE GLOBAL ECOSYSTEM"/>
     <Text style={[styles.sectionTitle,{color:theme.text,marginTop:6}]}>Discover what matters.</Text>
     <View style={[styles.searchRow,{backgroundColor:theme.surface,borderColor:theme.border,marginTop:13}]}>
      <Search size={20} color={theme.accentText}/>
      <TextInput value={query} onChangeText={setQuery} onSubmitEditing={()=>enterSearch(kind)}
       returnKeyType="search" accessibilityLabel="Search source records" autoCorrect={false} multiline={false} numberOfLines={1}
       placeholder="City, project or notice" placeholderTextColor={theme.muted}
       style={[styles.searchInput,{color:theme.text}]}/>
      <Pressable accessibilityRole="button" accessibilityLabel="Submit source search" onPress={()=>enterSearch(kind)}
       style={[styles.searchGo,{backgroundColor:theme.accent}]}><ArrowRight size={20} color={theme.onAccent}/></Pressable>
     </View>
     <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8,paddingVertical:15}}>
      {filters.map(filter=><Pressable key={filter.kind} accessibilityRole="button"
        accessibilityState={{selected:kind===filter.kind}}
        aria-pressed={kind===filter.kind}
        onPress={()=>{const next=queryForCategory(query,filter.kind);setQuery(next);setTerm(next);setKind(filter.kind);setDetail(null);}}
        style={[styles.chip,{borderColor:kind===filter.kind?theme.accentText:theme.border,backgroundColor:theme.surface}]}>
       <Text style={{fontSize:12,fontWeight:"800",color:kind===filter.kind?theme.accentText:theme.text}}>{filter.title}</Text>
      </Pressable>)}
     </ScrollView>
     {(kind==="tender"||(kind==="all"&&!!term))&&<View style={{marginBottom:14,gap:8}}>
      <Text style={{fontSize:12,fontWeight:"800",color:theme.text}}>Tender search region</Text>
      <Text style={{fontSize:11,lineHeight:17,color:theme.muted}}>
       Choose your country or select Worldwide. Location is never taken from your phone.
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8,paddingVertical:2}}>
       {tenderRegions.map(region=><Pressable key={region.code} accessibilityRole="button"
        accessibilityLabel={"Tender region "+region.label}
        accessibilityState={{selected:tenderRegion===region.code}}
        aria-pressed={tenderRegion===region.code}
        onPress={()=>{setTenderRegion(region.code);setDetail(null);}}
        style={[styles.chip,{borderColor:tenderRegion===region.code?theme.accentText:theme.border,backgroundColor:theme.surface,minHeight:44}]}>
        <Text style={{fontSize:12,fontWeight:"700",color:tenderRegion===region.code?theme.accentText:theme.text}}>{region.label}</Text>
       </Pressable>)}
      </ScrollView>
     </View>}
     {kind==="all"&&!term&&recent.ready&&recent.items.length>0&&<View style={{gap:9,paddingBottom:14}}>
      <Text style={{fontSize:12,fontWeight:"800",color:theme.muted}}>Your recent searches</Text>
      {recent.items.slice(0,5).map(item=><Pressable key={item} onPress={()=>enterSearch("all",item)}
       accessibilityRole="button" accessibilityLabel={"Repeat search "+item}
       style={[styles.serviceRow,{backgroundColor:theme.surface,borderColor:theme.border,marginBottom:0}]}>
       <Clock3 size={18} color={theme.accentText}/>
       <Text style={{color:theme.text,fontSize:13,fontWeight:"700",flex:1}} numberOfLines={1}>{item}</Text>
       <ArrowRight size={17} color={theme.accentText}/>
      </Pressable>)}
     </View>}
    </View>
    {kind==="all"&&!term?<View style={[styles.empty,{borderColor:theme.border,backgroundColor:theme.surface}]}>
      <Compass size={32} color={theme.accentText}/>
      <Text style={[styles.sectionTitle,{color:theme.text,textAlign:"center"}]}>One search. Trusted specialist sources.</Text>
      <Text style={{textAlign:"center",lineHeight:20,fontSize:13,color:theme.muted}}>Try Goa, Mumbai, a project or a tender keyword. Explore stays, properties, experiences and published opportunities in one place.</Text>
     </View>:kind==="travel"&&!term?<View style={[styles.empty,{borderColor:theme.border,backgroundColor:theme.surface}]}>
      <Plane size={33} color={theme.accentText}/>
      <Text style={[styles.sectionTitle,{color:theme.text,textAlign:"center"}]}>Where to next?</Text>
      <Text style={{textAlign:"center",fontSize:12,color:theme.muted}}>Flight fares require an origin, destination and travel dates. Continue to the existing search.</Text>
      <View style={{width:"100%",gap:10}}>
       <Action label="Explore hotels & stays" theme={theme} onPress={()=>{setKind("hotel");setTerm("");}}/>
       <Action label="Discover tours & activities" theme={theme} secondary onPress={()=>{setKind("tour");setTerm("");}}/>
       <Action label="Search flights on GTH PRO" theme={theme} secondary onPress={()=>openSite("/app/flights")}/>
       <Action label="Search bus journeys" theme={theme} secondary onPress={()=>openSite("/bus")}/>
       <Action label="Search train journeys" theme={theme} secondary onPress={()=>openSite("/train")}/>
       <Action label="Search ferry journeys" theme={theme} secondary onPress={()=>openSite("/ferry")}/>
      </View>
     </View>:<>
      <View style={{flexDirection:"row",flexWrap:"wrap",gap:6,justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
       <Text style={{color:theme.text,fontSize:17,fontWeight:"800"}}>{kind==="all"?"Across the GTH PRO ecosystem":kind==="travel"?"Travel experiences & stays":kind==="hotel"?"Stays & hotels":kind==="property"?"Property research":kind==="tender"?"Public tenders":"Experiences"}</Text>
       <Text accessibilityLiveRegion="polite" style={{color:theme.muted,fontSize:11}}>{pending?"Searching":results.length+" shown"+
        (slices.length>0&&slices.every(slice=>slice.totalIsExact)?" · "+total+" matches":discovery.hasMore?" · More available":"")}</Text>
      </View>
      {(kind==="all"||kind==="travel")&&slices.length>0&&<ScrollView horizontal showsHorizontalScrollIndicator={false}
       contentContainerStyle={{gap:8,marginBottom:12}}>
       {slices.map(slice=><Pressable key={slice.kind} accessibilityRole="button"
         accessibilityLabel={slice.kind+" "+slice.total+(slice.totalIsExact?"":" or more")+" matches"}
         onPress={()=>{setKind(slice.kind);setTerm(normalizeQuery(query));}}
         style={[styles.chip,{borderColor:theme.border,backgroundColor:theme.surface}]}>
         <Text style={{color:theme.text,fontSize:12,fontWeight:"700"}}>
          {slice.kind==="hotel"?"Hotels":slice.kind==="property"?"Property":slice.kind==="tender"?"Tenders":"Tours"} · {slice.total}{slice.totalIsExact?"":"+"}
         </Text>
        </Pressable>)}
       </ScrollView>}
      {warnings.length>0&&!pending&&<View accessibilityRole="alert" style={[styles.info,{backgroundColor:theme.surface,borderColor:theme.border,marginBottom:12}]}>
       <ShieldCheck color={theme.accentText} size={18}/>
       <Text style={{fontSize:12,lineHeight:18,flex:1,color:theme.muted}}>
        {warnings.length} {warnings.length===1?"source is":"sources are"} unavailable. {results.length?"Available results remain visible.":"Retry to reload these sources."}
       </Text>
      </View>}
      {pending&&<View accessibilityLiveRegion="polite" style={{padding:20,gap:12}}>
       <ActivityIndicator color={theme.accentText} accessibilityLabel="Loading source records"/>
       {[0,1,2].map(i=><View key={i} style={{height:76,borderRadius:16,backgroundColor:theme.surface,borderWidth:1,borderColor:theme.border}}/>)}
      </View>}
      {!!error&&<View style={[styles.info,{backgroundColor:theme.surface,borderColor:theme.border}]}>
       <Text style={{flex:1,color:theme.muted,fontSize:12}}>{error}</Text>
       <Pressable accessibilityRole="button" onPress={discovery.retry} style={{minHeight:44,minWidth:44,justifyContent:"center"}}><Text style={{color:theme.accentText,fontWeight:"800"}}>Retry</Text></Pressable>
      </View>}
      {!pending&&!error&&results.length===0&&<View style={[styles.empty,{backgroundColor:theme.surface,borderColor:theme.border}]}>
       <Search color={theme.accentText} size={28}/>
       <Text style={{color:theme.text,fontSize:16,fontWeight:"800"}}>No published results found</Text>
       <Text style={{color:theme.muted,textAlign:"center",fontSize:12,lineHeight:18}}>Try another city or term. GTH PRO never fabricates availability or records.</Text>
      </View>}
      {warnings.length>0&&!pending&&!error&&<Action label="Retry unavailable sources" theme={theme} secondary onPress={discovery.retry}/>}
     </>}
   </>:tab==="saved"?<>
    <View style={{paddingTop:13,marginBottom:12}}>
     <TextLabel theme={theme} text="YOUR PRIVATE SPACE"/>
     <Text style={[styles.sectionTitle,{color:theme.text,marginTop:6}]}>My Research Desk</Text>
     <Text style={{fontSize:12,color:theme.muted,marginTop:5}}>Saved only on this phone · no account sync or automatic sharing</Text>
    </View>
    {!bookmarks.ready&&<ActivityIndicator color={theme.accentText}/>}
    {bookmarks.ready&&bookmarks.items.length===0&&<View style={[styles.empty,{borderColor:theme.border,backgroundColor:theme.surface}]}>
     <Bookmark size={36} color={theme.accentText}/>
     <Text style={[styles.sectionTitle,{color:theme.text}]}>Your next discovery belongs here.</Text>
     <Text style={{fontSize:12,lineHeight:19,textAlign:"center",color:theme.muted}}>Save an original hotel, property or tender record to revisit it without searching again.</Text>
     <Action label="Start exploring" theme={theme} onPress={()=>setTab("discover")}/>
    </View>}
    {bookmarks.items.length>0&&<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8,paddingVertical:10}}>
     {filters.filter(filter=>filter.kind!=="travel").map(filter=><Pressable key={filter.kind} accessibilityRole="button"
       accessibilityLabel={"Saved: "+filter.title} accessibilityState={{selected:savedKind===filter.kind}} aria-pressed={savedKind===filter.kind}
       onPress={()=>setSavedKind(filter.kind as DiscoveryKind|"all")}
       style={[styles.chip,{backgroundColor:theme.surface,borderColor:savedKind===filter.kind?theme.accentText:theme.border}]}>
       <Text style={{color:theme.text,fontSize:12,fontWeight:"700"}}>{filter.title} · {bookmarks.items.filter(item=>filter.kind==="all"||item.kind===filter.kind).length}</Text>
      </Pressable>)}
    </ScrollView>}
    {bookmarks.items.length>0&&savedItems.length===0&&<View style={[styles.empty,{backgroundColor:theme.surface,borderColor:theme.border}]}>
     <Bookmark size={28} color={theme.accentText}/>
     <Text style={{color:theme.text,fontSize:16,fontWeight:"800",textAlign:"center"}}>No saved records in this category</Text>
     <Action label="Show all saved records" theme={theme} onPress={()=>setSavedKind("all")}/>
    </View>}
   </>:<ServicesHub theme={theme} onOpen={item=>item.mode==="native"?openPillar(item.kind):openSite(item.path)}/>}
   </>}
   ListFooterComponent={!activeItem&&resultView?<View style={{marginTop:10,gap:8}}>
    {discovery.morePending?<ActivityIndicator color={theme.accentText} accessibilityLabel="Loading more results"/>:
     discovery.hasMore&&!pending&&<Action label="Load more results" theme={theme} secondary onPress={()=>void discovery.loadMore()}/>}
    <Text style={{marginTop:12,color:theme.muted,fontSize:11,lineHeight:17}}>
     Open original details to confirm sources, prices, deadlines and current provider availability.
    </Text>
   </View>:null}/>
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
 hero:{marginTop:14,padding:16,borderWidth:1,borderRadius:22},
 h1:{fontSize:24,lineHeight:29,fontWeight:"900",letterSpacing:-0.4},
 lead:{fontSize:12,lineHeight:19,marginTop:6},
 searchRow:{borderWidth:1,borderRadius:15,minHeight:55,flexDirection:"row",alignItems:"center",paddingLeft:12,paddingRight:5,marginTop:12,gap:9},
 searchInput:{minHeight:48,flex:1,fontSize:13,lineHeight:20,minWidth:0,paddingVertical:8,includeFontPadding:false,textAlignVertical:"center"},
 searchGo:{width:44,height:44,alignItems:"center",justifyContent:"center",borderRadius:12},
 sectionTitle:{fontSize:20,fontWeight:"900",marginTop:5,letterSpacing:-0.3},
 journeyCard:{width:255,borderRadius:19,borderWidth:1,overflow:"hidden"},
 journeyBadge:{height:36,width:36,alignItems:"center",justifyContent:"center",borderRadius:12},
 info:{padding:15,borderRadius:17,borderWidth:1,flexDirection:"row",alignItems:"center",gap:12},
 serviceRow:{minHeight:65,padding:12,borderRadius:15,borderWidth:1,flexDirection:"row",alignItems:"center",gap:13,marginBottom:9},
 recent:{borderWidth:1,borderRadius:18,marginTop:14,paddingHorizontal:14,paddingVertical:8,gap:4},
 shortcutGrid:{flexDirection:"row",flexWrap:"wrap",gap:8},
 quickTile:{flexBasis:"30%",flexGrow:1,minWidth:75,minHeight:82,padding:10,borderRadius:16,borderWidth:1,alignItems:"center",justifyContent:"center",gap:8},
 tabbar:{height:57,flexDirection:"row",alignItems:"center",justifyContent:"space-around"},
 tab:{height:55,flex:1,alignItems:"center",justifyContent:"center",gap:3},
 chip:{borderWidth:1,paddingHorizontal:14,minHeight:44,borderRadius:24,alignItems:"center",justifyContent:"center"},
 record:{padding:12,borderWidth:1,borderRadius:17,marginBottom:10},
 fact:{flexBasis:"45%",flexGrow:1,minWidth:100,borderRadius:13,padding:12,gap:5},
 recordIcon:{height:64,width:64,borderRadius:14,alignItems:"center",justifyContent:"center",overflow:"hidden"},
 bookmarkButton:{width:44,height:44,borderRadius:13,borderWidth:1,alignItems:"center",justifyContent:"center"},
 empty:{padding:23,borderWidth:1,borderRadius:20,alignItems:"center",gap:13,marginTop:8},
 detail:{padding:20,borderWidth:1,borderRadius:21,marginTop:5},
 action:{minHeight:47,borderRadius:13,paddingHorizontal:15,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:9},
});
