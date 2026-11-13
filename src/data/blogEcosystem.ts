import type {Blog} from "./blogs";
import {crossTravelGuides} from "./blogCrossTravel";
import {crossPropertyGuides} from "./blogCrossProperty";
import {crossTenderGuides} from "./blogCrossTender";

export type EcosystemGuide=Blog & {
  pillar:"Travel"|"Real Estate"|"Tenders";
  publishedAt:"2026-11-13";
  resources:readonly {label:string;href:string;description:string}[];
  partnerSlugs?:readonly string[];
  nuitee?:boolean;
  gygCruiseDestination?:string;
  klookSearchDestination?:string;
};
/** Curated, independent educational articles; never a generated live inventory or legal/financial advice. */
export const ecosystemGuides:readonly EcosystemGuide[]=[
  ...crossTravelGuides,
  ...crossPropertyGuides,
  ...crossTenderGuides,
];
