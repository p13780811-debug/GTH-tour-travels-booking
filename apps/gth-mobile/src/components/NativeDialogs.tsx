import React,{useEffect,useRef,useState} from "react";
import {ActivityIndicator,Modal,Pressable,ScrollView,StyleSheet,Text,View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import colors from "../theme/generated.json";
import type {AppearanceMode} from "../core/appearance";

type Theme=typeof colors.light;
export type Confirmation={title:string;message:string;confirmLabel:string;action:()=>void|Promise<void>};
function Control({label,onPress,theme,selected=false,disabled=false,radio=false}:{label:string;onPress:()=>void;theme:Theme;selected?:boolean;disabled?:boolean;radio?:boolean}){
 return <Pressable accessibilityRole={radio?"radio":"button"} accessibilityLabel={label}
  aria-checked={radio?selected:undefined} aria-disabled={disabled}
  accessibilityState={radio?{disabled,checked:selected}:{disabled}} disabled={disabled} onPress={onPress}
  style={[styles.control,{backgroundColor:selected?theme.accent:theme.surfaceSoft,borderColor:theme.border,opacity:disabled?0.6:1}]}>
  <Text style={{fontSize:14,fontWeight:"700",color:selected?theme.onAccent:theme.text,textAlign:"center"}}>{label}</Text>
 </Pressable>;
}
function Sheet({theme,title,onClose,children}:{theme:Theme;title:string;onClose:()=>void;children:React.ReactNode}){
 return <SafeAreaView style={[styles.overlay,{backgroundColor:theme.bg}]}>
  <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
   <View accessibilityViewIsModal style={[styles.sheet,{backgroundColor:theme.surface,borderColor:theme.border}]}>
    <Text accessibilityRole="header" style={{fontSize:24,fontWeight:"800",color:theme.text}}>{title}</Text>
    {children}
    <Control label="Close" theme={theme} onPress={onClose}/>
   </View>
  </ScrollView>
 </SafeAreaView>;
}
export function ConfirmationDialog({request,theme,onClose}:{request:Confirmation|null;theme:Theme;onClose:()=>void}){
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState(false);
 const busyLock=useRef(false);
 useEffect(()=>{setError(false);},[request]);
 async function confirm(){
  if(!request||busyLock.current)return;
  busyLock.current=true;
  setBusy(true);setError(false);
  try{await request.action();onClose();}
  catch{setError(true);}
  finally{busyLock.current=false;setBusy(false);}
 }
 return <Modal visible={request!==null} transparent animationType="fade" onRequestClose={()=>{if(!busy)onClose();}}>
  <Sheet theme={theme} title={request?.title??"Continue"} onClose={()=>{if(!busy)onClose();}}>
   <Text style={{fontSize:14,lineHeight:22,color:theme.muted}}>{request?.message}</Text>
   {error&&<Text accessibilityRole="alert" style={{color:theme.text}}>Unable to complete this action. Please retry.</Text>}
   {busy&&<ActivityIndicator color={theme.accent} accessibilityLabel="Opening requested service"/>}
   <Control label={request?.confirmLabel??"Continue"} theme={theme} selected disabled={busy} onPress={()=>void confirm()}/>
  </Sheet>
 </Modal>;
}
export function SettingsDialog({visible,theme,mode,ready,dataReady,onMode,onClose,onClearSaved,onClearHistory,onWebsite}:{
 visible:boolean;theme:Theme;mode:AppearanceMode;ready:boolean;dataReady:boolean;onMode:(mode:AppearanceMode)=>void;onClose:()=>void;
 onClearSaved:()=>void;onClearHistory:()=>void;onWebsite:(path:string)=>void;
}){
 return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
  <Sheet theme={theme} title="App settings" onClose={onClose}>
   <Text style={{fontSize:16,fontWeight:"800",color:theme.text}}>Appearance</Text>
   <Text style={{fontSize:13,lineHeight:21,color:theme.muted}}>Use your phone appearance or choose a day/night theme.</Text>
   <Text style={{fontSize:12,lineHeight:19,color:theme.muted}}>Live services keep your saved website appearance.</Text>
   <View accessibilityRole="radiogroup" accessibilityLabel="App appearance" style={{gap:12}}>
    {([{id:"system",label:"Use device theme"},{id:"light",label:"Day theme"},{id:"dark",label:"Night theme"}] as const).map(item=>
     <Control key={item.id} radio label={item.label} theme={theme} selected={mode===item.id} disabled={!ready} onPress={()=>onMode(item.id)}/>)}
   </View>
   <Text style={{fontSize:16,fontWeight:"800",color:theme.text,marginTop:12}}>Your device data</Text>
   <Text style={{fontSize:13,lineHeight:21,color:theme.muted}}>Saved records and recent searches stay on this device. Clearing them does not change any website account.</Text>
   <Control label="Clear saved records" theme={theme} disabled={!dataReady} onPress={onClearSaved}/>
   <Control label="Clear search history" theme={theme} disabled={!dataReady} onPress={onClearHistory}/>
   <Text style={{fontSize:16,fontWeight:"800",color:theme.text,marginTop:12}}>Support & information</Text>
   <Control label="Privacy policy" theme={theme} onPress={()=>onWebsite("/privacy-policy")}/>
   <Control label="Terms & conditions" theme={theme} onPress={()=>onWebsite("/terms-and-conditions")}/>
   <Control label="Contact GTH PRO" theme={theme} onPress={()=>onWebsite("/contact")}/>
  </Sheet>
 </Modal>;
}
const styles=StyleSheet.create({
 overlay:{flex:1},content:{flexGrow:1,justifyContent:"center",padding:18},
 sheet:{width:"100%",maxWidth:520,alignSelf:"center",borderRadius:24,borderWidth:1,padding:20,gap:12},
 control:{minHeight:48,borderRadius:13,borderWidth:1,paddingHorizontal:14,paddingVertical:12,justifyContent:"center"},
});
