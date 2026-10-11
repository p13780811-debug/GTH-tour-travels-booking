"use client"
import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"

const KEY = "theme-mode"
export default function ThemeToggle() {
 const [dark, setDark] = useState(true)
 useEffect(() => {
  const sync = () => {
   let chosen: string | null = null
   try { chosen = window.localStorage.getItem(KEY) } catch { /* Storage can be disabled. */ }
   const next = chosen === "day" ? false : chosen === "night" ? true : document.documentElement.classList.contains("dark")
   setDark(next)
   document.documentElement.classList.toggle("dark", next)
  }
  sync()
  window.addEventListener("storage", sync)
  return () => window.removeEventListener("storage", sync)
 }, [])
 const toggleTheme = () => {
  const next = !dark
  document.documentElement.classList.toggle("dark", next)
  setDark(next)
  try { window.localStorage.setItem(KEY, next ? "night" : "day") } catch { /* Theme remains usable for this visit. */ }
 }
 return <button type="button" onClick={toggleTheme} aria-label={dark ? "Switch to day mode" : "Switch to night mode"} title={dark ? "Day mode" : "Night mode"} className="gth-glass flex h-11 w-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]">{dark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}</button>
}
