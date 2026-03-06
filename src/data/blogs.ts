import { generateBlogs } from "@/lib/autoBlogs"

export const blogs = generateBlogs()

export interface Blog {
    slug: string
    title: string
    description: string
    image: string
    content: string
}

