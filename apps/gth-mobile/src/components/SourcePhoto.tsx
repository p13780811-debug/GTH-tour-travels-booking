import React,{useEffect,useState} from "react";
import {Image,Pressable,Text,View} from "react-native";
import {ImageOff} from "lucide-react-native";
import colors from "../theme/generated.json";
import type {DiscoveryCard} from "../core/catalog";

type Theme=typeof colors.light;
export function SourcePhoto({item,theme,large=false}:{item:DiscoveryCard;theme:Theme;large?:boolean}){
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[item.image]);
 const frame=large?{height:180,width:"100%" as const,borderRadius:15}:{height:64,width:64,borderRadius:13};
 return item.image&&!failed?<Image source={{uri:item.image}} resizeMode="cover" onError={()=>setFailed(true)}
   accessibilityLabel={"Source image for "+item.title} style={frame}/>:
  <View accessibilityLabel="Source photo unavailable" style={[frame,{backgroundColor:theme.surfaceSoft,alignItems:"center",justifyContent:"center",gap:8}]}>
   <ImageOff size={large?30:23} color={theme.muted}/>
   {large&&<Text style={{color:theme.muted,fontSize:12}}>Source photo unavailable</Text>}
  </View>;
}
export function PhotoCreditLine({item,theme,onOpen,compact=false}:{item:DiscoveryCard;theme:Theme;onOpen:(kind:"page"|"license")=>void;compact?:boolean}){
 if(!item.photoCredit)return null;
 const credit=item.photoCredit;
 return <View style={{gap:3,marginTop:compact?5:10}}>
  <Pressable accessibilityRole="button" accessibilityLabel={"Photo credits for "+item.title+": "+credit.author+", "+credit.license}
    onPress={()=>onOpen("page")} style={{minHeight:44,justifyContent:"center"}}>
   <Text numberOfLines={compact?2:undefined} style={{color:theme.muted,fontSize:11,lineHeight:17}}>
    Photo: {credit.author} · {credit.license} · Wikimedia Commons ↗
   </Text>
  </Pressable>
  {!compact&&<Pressable accessibilityRole="button" accessibilityLabel="Open photo license" onPress={()=>onOpen("license")}
    style={{minHeight:44,justifyContent:"center"}}><Text style={{color:theme.accentText,fontSize:12,textDecorationLine:"underline"}}>Read photo license ↗</Text></Pressable>}
 </View>;
}
