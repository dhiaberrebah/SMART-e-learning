'use client'

import { useEffect } from 'react'

export default function HomeAnimations() {
  useEffect(() => {
    // ── Intersection Observer for scroll-reveal elements ──
    const revealClasses = ['.reveal', '.reveal-left', '.reveal-right', '.reveal-scale']
    const elements = document.querySelectorAll<HTMLElement>(revealClasses.join(','))

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )

    elements.forEach((el) => observer.observe(el))

    // ── Animated counters ──
    const counters = document.querySelectorAll<HTMLElement>('[data-counter]')

    const countObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const el = entry.target as HTMLElement
          const target = parseInt(el.dataset.counter ?? '0', 10)
          const suffix = el.dataset.suffix ?? ''
          const duration = 1600
          const start = performance.now()

          const step = (now: number) => {
            const elapsed = now - start
            const progress = Math.min(elapsed / duration, 1)
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3)
            el.textContent = Math.round(eased * target) + suffix
            if (progress < 1) requestAnimationFrame(step)
          }

          requestAnimationFrame(step)
          countObserver.unobserve(el)
        })
      },
      { threshold: 0.5 }
    )

    counters.forEach((el) => countObserver.observe(el))

    return () => {
      observer.disconnect()
      countObserver.disconnect()
    }
  }, [])

  return null
}
