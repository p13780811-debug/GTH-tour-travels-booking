import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SportsTicketsExperience from "@/components/sports-tickets/SportsTicketsExperience";
import { sportsTicketingPageAccessible, sportsTicketingPubliclyEnabled, searchAuthorizedSportsEvents } from "@/lib/sports-tickets/service";
import { parseSportsTicketFilters } from "@/lib/sports-tickets/validation";
import { AUTHORIZED_TICKET_PROVIDERS } from "@/lib/sports-tickets/providers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Deliberately noindex until both supplier authorization and a separately reviewed launch.
export const metadata: Metadata = {
  title: "Sports & Stadium Tickets · Staged | GTH PRO Travel",
  description: "Preparation-only global sports and stadium ticketing experience. No live ticket sales or availability.",
  robots: { index: false, follow: false, nocache: true },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function SportsTicketsPage({ searchParams }: Props) {
  if (!sportsTicketingPageAccessible()) notFound();
  const parsed = parseSportsTicketFilters(await searchParams);
  if (!parsed.ok) notFound();
  const events = await searchAuthorizedSportsEvents(parsed.value);
  return <SportsTicketsExperience filters={parsed.value} events={events}
    providerConnected={AUTHORIZED_TICKET_PROVIDERS.length > 0} publiclyEnabled={sportsTicketingPubliclyEnabled()} />;
}
