import React,{useState} from "react";
import {Pressable,StyleSheet,Text,View} from "react-native";
import {ArrowLeft,Check,Square} from "lucide-react-native";
import type {DiscoveryCard,DiscoveryKind} from "../core/catalog";
import colors from "../theme/generated.json";

const categories:{id:DiscoveryKind;label:string}[]=[
 {id:"hotel",label:"Stays"},{id:"tour",label:"Experiences"},
 {id:"property",label:"Properties"},{id:"tender",label:"Tenders"},
];
const limit=3;

export default function SavedComparison({items,initialKind,onClose,theme}:{
 items:DiscoveryCard[];initialKind:DiscoveryKind|"all";onClose:()=>void;theme:typeof colors.light;
}){
 const [kind,setKind]=useState<DiscoveryKind>(()=>initialKind!=="all"?initialKind:
  categories.find(category=>items.filter(item=>item.kind===category.id).length>=2)?.id??items[0]?.kind??"hotel");
 const [paths,setPaths]=useState<string[]>([]);
 const candidates=items.filter(item=>item.kind===kind&&item.webPath);
 const selected=candidates.filter(item=>paths.includes(item.webPath!));
 const rows=[
  {label:"Published reference",values:selected.map(item=>item.subtitle)},
  {label:"Source",values:selected.map(item=>item.source)},
  ...Array.from(new Set(selected.flatMap(item=>item.facts?.map(fact=>fact.label)??[])),label=>({
   label,values:selected.map(item=>item.facts?.find(fact=>fact.label===label)?.value??"Not reported"),
  })),
 ];
 const border={borderColor:theme.border};
 return <View style={styles.workspace}>
  <Pressable accessibilityRole="button" onPress={onClose} style={styles.back}>
   <ArrowLeft size={19} color={theme.accentText}/><Text style={{color:theme.text,fontWeight:"800"}}>Back to saved records</Text>
  </Pressable>
  <Text accessibilityRole="header" style={{color:theme.text,fontSize:24,fontWeight:"800"}}>Compare saved records</Text>
  <Text style={{color:theme.muted,lineHeight:20}}>Pick two or three records from the same category. Comparison uses the last saved source details on this phone.</Text>
  <View style={styles.categories}>
   {categories.map(category=><Pressable key={category.id} accessibilityRole="button" accessibilityLabel={"Compare "+category.label}
    accessibilityState={{selected:kind===category.id}} onPress={()=>{if(kind!==category.id){setKind(category.id);setPaths([]);}}}
    style={[styles.chip,border,{backgroundColor:kind===category.id?theme.surfaceSoft:theme.surface}]}>
    <Text style={{color:kind===category.id?theme.accentText:theme.text,fontWeight:"800"}}>{category.label}</Text>
   </Pressable>)}
  </View>
  {candidates.length<2&&<Text style={{color:theme.muted,lineHeight:20}}>Save at least two records in this category to compare them here.</Text>}
  {candidates.length>=2&&<>
   <Text accessibilityLiveRegion="polite" style={{color:theme.muted}}>{selected.length} of {limit} selected</Text>
   {selected.length>=2&&<View style={[styles.table,border,{backgroundColor:theme.surface}]}>
    <View style={styles.columns}>{selected.map(item=><Text key={item.webPath} style={[styles.cell,{color:theme.text,fontWeight:"800"}]}>{item.title}</Text>)}</View>
    {rows.map(row=><View key={row.label} style={[styles.row,border]}>
     <Text style={{color:theme.accentText,fontSize:12,fontWeight:"800"}}>{row.label}</Text>
     <View style={styles.columns}>{row.values.map((value,index)=><Text key={selected[index].webPath} style={[styles.cell,{color:theme.text}]}>{value}</Text>)}</View>
    </View>)}
   </View>}
   {candidates.map(item=>{
    const path=item.webPath!;
    const checked=paths.includes(path);
    const disabled=!checked&&selected.length>=limit;
    const Icon=checked?Check:Square;
    return <Pressable key={path} accessibilityRole="checkbox" accessibilityLabel={"Compare "+item.title}
     accessibilityState={{checked,disabled}} disabled={disabled}
     onPress={()=>setPaths(current=>current.includes(path)?current.filter(entry=>entry!==path):current.length<limit?[...current,path]:current)}
     style={[styles.choice,border,{backgroundColor:theme.surface,opacity:disabled?0.55:1}]}>
     <Icon size={20} color={theme.accentText}/><Text style={{flex:1,color:theme.text,fontWeight:"700"}}>{item.title}</Text>
    </Pressable>;
   })}
  </>}
 </View>;
}

const styles=StyleSheet.create({
 workspace:{gap:12,paddingBottom:10},back:{flexDirection:"row",alignItems:"center",gap:8,minHeight:48},
 categories:{flexDirection:"row",flexWrap:"wrap",gap:8},
 chip:{borderWidth:1,borderRadius:18,paddingHorizontal:12,minHeight:44,justifyContent:"center"},
 table:{borderWidth:1,borderRadius:16,padding:10,gap:10},
 row:{borderTopWidth:1,paddingTop:8,gap:4},columns:{flexDirection:"row",gap:8},cell:{flex:1,minWidth:0,fontSize:12,lineHeight:18},
 choice:{borderWidth:1,borderRadius:14,minHeight:48,padding:10,flexDirection:"row",alignItems:"center",gap:8},
});
