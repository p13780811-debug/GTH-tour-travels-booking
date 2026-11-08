import React,{useMemo,useState} from "react";
import {Pressable,ScrollView,StyleSheet,Text,TextInput,View} from "react-native";
import {ArrowRight,ArrowUpRight,BadgePercent,BookOpen,Bookmark,Building2,Bus,Car,Compass,FileText,Hotel,Landmark,MapPin,Plane,Route,Search,ShieldCheck,Ship,SlidersHorizontal,Ticket,TrainFront,User} from "lucide-react-native";
import colors from "../theme/generated.json";
import {filterServices,SERVICE_GROUPS,serviceGroup,type NativeService,type ServiceGroup} from "../core/services";

const icons={plane:Plane,hotel:Hotel,building:Building2,tender:FileText,bus:Bus,train:TrainFront,ship:Ship,car:Car,route:Route,compass:Compass,ticket:Ticket,shield:ShieldCheck,map:MapPin,book:BookOpen,offer:BadgePercent,landmark:Landmark,bookmark:Bookmark,tools:SlidersHorizontal,user:User};
type Theme=typeof colors.light;
export function ServiceIcon({service,theme,size=23}:{service:NativeService;theme:Theme;size?:number}){
 const Icon=icons[service.icon];return <Icon size={size} color={theme.accentText}/>;
}
export default function ServicesHub({theme,onOpen}:{theme:Theme;onOpen:(service:NativeService)=>void}){
 const [query,setQuery]=useState("");
 const [group,setGroup]=useState<ServiceGroup|"all">("all");
 const visible=useMemo(()=>filterServices(query,group),[query,group]);
 return <View style={{paddingTop:14,gap:16}}>
  <View style={{gap:7}}>
   <Text style={{color:theme.accentText,fontSize:10,fontWeight:"900",letterSpacing:1.5}}>ONE CONNECTED ECOSYSTEM</Text>
   <Text accessibilityRole="header" style={{color:theme.text,fontSize:27,fontWeight:"900",letterSpacing:-0.6}}>Explore every service</Text>
   <Text style={{color:theme.muted,fontSize:13,lineHeight:20}}>Your next journey, property or opportunity starts here.</Text>
  </View>
  <View style={[styles.search,{backgroundColor:theme.surface,borderColor:theme.border}]}>
   <Search size={19} color={theme.accentText}/>
   <TextInput accessibilityLabel="Find a service" placeholder="Find a service" placeholderTextColor={theme.muted}
    value={query} onChangeText={setQuery} autoCorrect={false} multiline={false} returnKeyType="search"
    style={{flex:1,minWidth:0,minHeight:48,paddingVertical:10,fontSize:14,color:theme.text,includeFontPadding:false}}/>
   {!!query&&<Pressable accessibilityRole="button" accessibilityLabel="Clear service search" onPress={()=>setQuery("")}
     style={{minHeight:44,minWidth:44,justifyContent:"center"}}><Text style={{color:theme.text,fontSize:12,fontWeight:"700"}}>Clear</Text></Pressable>}
  </View>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{gap:8,paddingBottom:2}}>
   {[{id:"all",label:"All"},...SERVICE_GROUPS].map(item=><Pressable key={item.id} accessibilityRole="button"
     accessibilityLabel={"Services: "+item.label} accessibilityState={{selected:group===item.id}} aria-pressed={group===item.id}
     onPress={()=>setGroup(item.id as ServiceGroup|"all")}
     style={[styles.chip,{borderColor:group===item.id?theme.accentText:theme.border,backgroundColor:group===item.id?theme.surfaceSoft:theme.surface}]}>
     <Text style={{color:theme.text,fontSize:12,fontWeight:"800"}}>{item.label}</Text>
    </Pressable>)}
  </ScrollView>
  <Text accessibilityLiveRegion="polite" style={{color:theme.muted,fontSize:12}}>{visible.length} services · choose how to continue</Text>
  {SERVICE_GROUPS.map(section=>{
   const items=visible.filter(service=>serviceGroup(service)===section.id);
   if(!items.length)return null;
   return <View key={section.id} style={{gap:10,marginBottom:5}}>
    <View style={{gap:4,marginBottom:3}}>
     <Text accessibilityRole="header" style={{color:theme.text,fontSize:20,fontWeight:"900"}}>{section.label}</Text>
     <Text style={{color:theme.muted,fontSize:12,lineHeight:18}}>{section.caption}</Text>
    </View>
    {items.map(service=><Pressable key={service.label} accessibilityRole="button"
      accessibilityLabel={service.label+" · "+(service.mode==="native"?"Explore in app":"GTH PRO website")}
      onPress={()=>onOpen(service)} style={({pressed})=>[styles.row,{backgroundColor:theme.surface,borderColor:theme.border,opacity:pressed?0.78:1}]}>
      <View style={[styles.icon,{backgroundColor:theme.surfaceSoft}]}><ServiceIcon service={service} theme={theme}/></View>
      <View style={{flex:1,gap:5}}>
       <Text style={{color:theme.text,fontSize:14,fontWeight:"800"}}>{service.label}</Text>
       <Text style={{color:theme.muted,fontSize:12,lineHeight:18}}>{service.description}</Text>
       <Text style={{color:theme.accentText,fontSize:10,fontWeight:"700"}}>{service.mode==="native"?"Explore in app":"Continue on GTH PRO website"}</Text>
      </View>
      {service.mode==="native"?<ArrowRight size={18} color={theme.text}/>:<ArrowUpRight size={18} color={theme.text}/>}
     </Pressable>)}
   </View>;
  })}
  {!visible.length&&<View style={[styles.empty,{backgroundColor:theme.surface,borderColor:theme.border}]}>
   <Search size={28} color={theme.accentText}/>
   <Text style={{color:theme.text,fontSize:17,fontWeight:"800"}}>No matching service</Text>
   <Text style={{color:theme.muted,textAlign:"center",fontSize:13,lineHeight:20}}>Try another name or browse all three ecosystems.</Text>
   <Pressable accessibilityRole="button" accessibilityLabel="Show all services" onPress={()=>{setQuery("");setGroup("all");}}
     style={[styles.reset,{backgroundColor:theme.accent}]}><Text style={{color:theme.onAccent,fontWeight:"800"}}>Show all services</Text></Pressable>
  </View>}
  <Text style={{color:theme.muted,fontSize:11,lineHeight:18}}>Bookings and account tools continue through the existing GTH PRO service. Your native saved records remain on this device.</Text>
 </View>;
}
const styles=StyleSheet.create({
 search:{minHeight:54,borderWidth:1,borderRadius:17,paddingHorizontal:13,flexDirection:"row",alignItems:"center",gap:10},
 chip:{minHeight:44,paddingHorizontal:16,borderWidth:1,borderRadius:24,justifyContent:"center"},
 row:{padding:14,borderWidth:1,borderRadius:19,flexDirection:"row",alignItems:"center",gap:12},
 icon:{width:47,height:47,borderRadius:15,alignItems:"center",justifyContent:"center"},
 empty:{borderWidth:1,borderRadius:20,padding:22,alignItems:"center",gap:14},
 reset:{minHeight:48,borderRadius:13,paddingHorizontal:18,justifyContent:"center"},
});
