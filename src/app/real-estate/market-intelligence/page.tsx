import type {Metadata} from 'next';
import LocalityPriceExplorer from '@/components/real-estate/LocalityPriceExplorer';
import JourneyNav from '@/components/real-estate/JourneyNav';
export const metadata:Metadata={title:'Recorded property market evidence | GTH PRO',description:'Research published asking-price observations and independently source-reviewed transaction samples by country, city, currency, property type and area basis.',alternates:{canonical:'https://www.gthproglobal.com/real-estate/market-intelligence'}};
export default function MarketIntelligencePage(){return <main className="gth-container pb-28 pt-8"><JourneyNav/><h1 className="mt-6 text-3xl font-bold">Property market evidence</h1><p className="mt-3 text-sm leading-7">Real observed evidence, separate from registry data and research scenarios. No generated valuations, sold prices, forecast returns or artificial charts.</p><LocalityPriceExplorer/></main>;}
