import PropertyCard from "./PropertyCard"

export default function PropertyGrid({
    properties,
    onSelect,
    onLead
}: any) {
    return (
        <div className="grid md:grid-cols-3 gap-6 p-6">
            {properties.map((p: any) => (
                <PropertyCard
                    key={p.id}
                    p={p}
                    onSelect={onSelect}
                    onLead={onLead}
                />


            ))}
        </div>
    )
}