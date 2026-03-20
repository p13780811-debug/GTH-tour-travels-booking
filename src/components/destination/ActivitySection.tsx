'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ActivitySection({ destination }: { destination: any }) {

    const [activities, setActivities] = useState<any[]>([]);
    const [carouselItems, setCarouselItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const sliderRef = useRef<HTMLDivElement>(null);
    const autoplayRef = useRef<any>(null);

    const isDragging = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);

    // Fetch activities
    useEffect(() => {
        async function getActivities() {

            if (!destination?.slug) {
                setLoading(false);
                return;
            }

            const { data } = await supabase
                .from('activities')
                .select('*')
                .eq('city_slug', destination.slug);

            if (data) {
                setActivities(data);
                setCarouselItems([...data]);
            }

            setLoading(false);
        }

        getActivities();
    }, [destination]);

    // Infinite scroll helper
    const checkInfiniteScroll = () => {

        if (!sliderRef.current) return;

        const scrollWidth = sliderRef.current.scrollWidth / 2;

        if (sliderRef.current.scrollLeft >= scrollWidth) {
            sliderRef.current.scrollLeft -= scrollWidth;
        }

        if (sliderRef.current.scrollLeft <= 0) {
            sliderRef.current.scrollLeft += scrollWidth;
        }

    };

    // Start autoplay
    const startAutoplay = () => {

        stopAutoplay();

        autoplayRef.current = setInterval(() => {

            if (!sliderRef.current) return;

            sliderRef.current.scrollLeft += 1;

            checkInfiniteScroll();

        }, 20);

    };

    // Stop autoplay
    const stopAutoplay = () => {
        if (autoplayRef.current) clearInterval(autoplayRef.current);
    };

    useEffect(() => {

        if (!sliderRef.current || carouselItems.length === 0) return;

        sliderRef.current.scrollLeft = sliderRef.current.scrollWidth / 4;

        startAutoplay();

        return () => stopAutoplay();

    }, [carouselItems]);

    // Drag logic
    const onMouseDown = (e: any) => {

        stopAutoplay();

        isDragging.current = true;

        startX.current = e.pageX - sliderRef.current!.offsetLeft;

        scrollLeft.current = sliderRef.current!.scrollLeft;

    };

    const onMouseMove = (e: any) => {

        if (!isDragging.current) return;

        e.preventDefault();

        const x = e.pageX - sliderRef.current!.offsetLeft;

        const walk = (x - startX.current) * 2;

        sliderRef.current!.scrollLeft = scrollLeft.current - walk;

        checkInfiniteScroll();

    };

    const onMouseUp = () => {

        isDragging.current = false;

        startAutoplay();

    };

    const onTouchStart = (e: any) => {

        stopAutoplay();

        startX.current = e.touches[0].pageX;

        scrollLeft.current = sliderRef.current!.scrollLeft;

    };

    const onTouchMove = (e: any) => {

        const x = e.touches[0].pageX;

        const walk = (x - startX.current) * 2;

        sliderRef.current!.scrollLeft = scrollLeft.current - walk;

        checkInfiniteScroll();

    };

    if (loading)
        return (
            <div className="p-10 text-white text-center bg-black">
                LOADING...
            </div>
        );

    if (activities.length === 0)
        return (
            <div className="p-10 text-zinc-500 text-center bg-black">
                No activities for {destination?.name}
            </div>
        );

    return (

        <section className="bg-black py-12 px-4 relative overflow-hidden">

            <div className="max-w-6xl mx-auto">

                {/* Title */}
                <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
                    Top Experiences in <span className="text-yellow-500">{destination?.name}</span>
                </h2>

                {/* SEO Tagline */}
                <p className="text-zinc-400 text-sm mb-6">
                    Discover the best tours, adventures and travel experiences in {destination?.name}.
                </p>

                {/* Gradient */}
                <div className="absolute left-0 top-0 h-full w-16 bg-gradient-to-r from-black to-transparent pointer-events-none z-10" />
                <div className="absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-black to-transparent pointer-events-none z-10" />

                {/* Slider */}
                <div
                    ref={sliderRef}
                    className="flex gap-4 overflow-x-auto cursor-grab scroll-smooth pb-6"

                    style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none'
                    }}

                    onMouseEnter={stopAutoplay}
                    onMouseLeave={startAutoplay}

                    onMouseDown={onMouseDown}
                    onMouseMove={onMouseMove}
                    onMouseUp={onMouseUp}


                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                >

                    {carouselItems.map((item: any, index: number) => (

                        <div
                            key={index}
                            className="min-w-[200px] md:min-w-[220px] lg:min-w-[240px] bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-yellow-500 transition flex-shrink-0"
                        >

                            {/* Image */}
                            <div className="h-40 w-full overflow-hidden">

                                <img
                                    src={item.image_url}
                                    alt={item.title}
                                    className="w-full h-full object-cover hover:scale-110 transition duration-500"
                                    onError={(e) =>
                                    (e.currentTarget.src =
                                        'https://images.pexels.com/photos/674010/pexels-photo-674010.jpeg')
                                    }
                                />

                            </div>

                            {/* Content */}
                            <div className="p-3">

                                <h3 className="text-white text-sm font-bold uppercase">
                                    {item.title}
                                </h3>

                                <div className="flex justify-between items-center mt-2">

                                    <span className="text-yellow-500 font-bold">
                                        ₹{item.price}
                                    </span>

                                    <button className="bg-yellow-500 text-black text-xs px-3 py-1 rounded-full font-bold">
                                        Book
                                    </button>

                                </div>

                            </div>

                        </div>

                    ))}

                </div>

            </div>

        </section>

    );

}