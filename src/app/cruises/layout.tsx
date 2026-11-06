/** Cruise-only GetYourGuide integration: leave the approved root shell unchanged.
 * React/Next hoists external async scripts into the document head.
 */
export default function CruisesLayout({children}:{children:React.ReactNode}){
 return <>
  <script async defer src="https://widget.getyourguide.com/dist/pa.umd.production.min.js" data-gyg-partner-id="DF3NBKA"/>
  {children}
 </>;
}
