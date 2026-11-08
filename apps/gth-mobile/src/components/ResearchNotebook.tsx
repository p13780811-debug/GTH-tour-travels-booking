import React,{useEffect,useState} from "react";
import {Pressable,Text,TextInput,View} from "react-native";
import {Check} from "lucide-react-native";
import colors from "../theme/generated.json";
import type {SavedDiscoveryCard} from "../core/bookmarks";
import {parseResearch,researchSteps} from "../core/research";

export default function ResearchNotebook({item,theme,onNote,onCheck}:{item:SavedDiscoveryCard;theme:typeof colors.light;onNote:(note:string)=>void;onCheck:(id:string)=>void}){
 const research=parseResearch(item.research,item.kind);
 const [draft,setDraft]=useState(research.note);
 useEffect(()=>setDraft(research.note),[item.webPath,research.note]);
 return <View style={{marginTop:24,gap:12,borderTopWidth:1,borderColor:theme.border,paddingTop:20}}>
  <Text accessibilityRole="header" style={{color:theme.text,fontSize:19,fontWeight:"900"}}>Your research notebook</Text>
  <Text style={{color:theme.muted,fontSize:12,lineHeight:19}}>Personal notes and checks · only on this device · available offline</Text>
  <Text style={{color:theme.text,fontSize:13,fontWeight:"800"}}>My review · {research.checked.length}/4 checked</Text>
  {researchSteps(item.kind).map(step=>{
   const checked=research.checked.includes(step.id);
   return <Pressable key={step.id} accessibilityRole="checkbox" accessibilityLabel={step.label}
    accessibilityState={{checked}} aria-checked={checked} onPress={()=>onCheck(step.id)}
    style={{flexDirection:"row",alignItems:"center",gap:12,minHeight:48,paddingVertical:8}}>
    <View style={{width:25,height:25,borderWidth:1.5,borderColor:theme.accentText,borderRadius:8,alignItems:"center",justifyContent:"center",backgroundColor:checked?theme.accent:theme.surface}}>
     {checked&&<Check size={17} color={theme.onAccent}/>}
    </View>
    <Text style={{flex:1,color:theme.text,fontSize:13,lineHeight:20}}>{step.label}</Text>
   </Pressable>;
  })}
  <Text style={{color:theme.text,fontSize:13,fontWeight:"800"}}>Questions, plans and reminders</Text>
  <TextInput accessibilityLabel="Private research note" multiline maxLength={600} value={draft} onChangeText={setDraft}
    placeholder="What would you like to check before deciding?" placeholderTextColor={theme.muted}
    style={{backgroundColor:theme.surfaceSoft,color:theme.text,borderRadius:14,padding:14,minHeight:116,fontSize:14,lineHeight:22,textAlignVertical:"top"}}/>
  <View style={{flexDirection:"row",flexWrap:"wrap",gap:10,alignItems:"center",justifyContent:"space-between"}}>
   <Text style={{color:theme.muted,fontSize:11}}>{draft.length}/600 characters</Text>
   <Pressable accessibilityRole="button" accessibilityLabel="Save private note" disabled={draft===research.note}
    accessibilityState={{disabled:draft===research.note}} onPress={()=>onNote(draft)}
    style={{minHeight:48,paddingHorizontal:15,borderRadius:13,backgroundColor:draft===research.note?theme.surfaceSoft:theme.accent,justifyContent:"center"}}>
    <Text style={{color:draft===research.note?theme.muted:theme.onAccent,fontWeight:"800",fontSize:13}}>{draft===research.note?"Note up to date":"Save note"}</Text>
   </Pressable>
  </View>
  <Text style={{color:theme.muted,fontSize:11,lineHeight:18}}>These are your own research checks. Confirm facts and requirements with the original source. Sharing a public record does not share your private note.</Text>
 </View>;
}
