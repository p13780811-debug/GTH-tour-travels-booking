export interface PartnerItem {
    partner_link?: string
}

export interface AutomationResult {
    link: string
    buttonText: string
}

export const gthAutomation = (
    item: PartnerItem,
    userLanguage: string
): AutomationResult => {

    const baseLink = item.partner_link || ""

    const secureLink = baseLink.startsWith("http")
        ? baseLink
        : `https://${baseLink}`

    const finalLink = `${secureLink}?subid=gth_edu_1percent&return_url=https://gthpro.com/success`

    const translations: Record<string, { bookNow: string }> = {

        english: { bookNow: "BOOK NOW" },

        hindi: { bookNow: "अभी बुक करें" },

        bangla: { bookNow: "এখন বুক করুন" },

        marathi: { bookNow: "आता बुक करा" },

        tamil: { bookNow: "இப்போது பதிவு செய்யுங்கள்" },

        telugu: { bookNow: "ఇప్పుడే బుక్ చేయండి" },

        gujarati: { bookNow: "હવે બુક કરો" },

        kannada: { bookNow: "ಈಗ ಬುಕ್ ಮಾಡಿ" },

        malayalam: { bookNow: "ഇപ്പോൾ ബുക്ക് ചെയ്യൂ" },

        punjabi: { bookNow: "ਹੁਣ ਬੁੱਕ ਕਰੋ" },

        odia: { bookNow: "ଏବେ ବୁକ୍ କରନ୍ତୁ" },

        assamese: { bookNow: "এতিয়া বুক কৰক" },

        urdu: { bookNow: "ابھی بک کریں" }
    }

    const text = translations[userLanguage] || translations.english

    return {
        link: finalLink,
        buttonText: text.bookNow
    }
}