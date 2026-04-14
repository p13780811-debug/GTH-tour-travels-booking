import PropertyClient from "@/components/real-estate/PropertyClient"
import PropertyDetailClient from "@/components/real-estate/PropertyDetailClient"
export async function generateMetadata({ params }: any) {
    return {
        title: `Buy Property in ${params.slug} | GTH ProEstate`,
        description: `Explore ${params.slug} properties with best deals`
    }
}

export default function Page({ params }: any) {
    return <PropertyDetailClient slug={params.slug} />
}
