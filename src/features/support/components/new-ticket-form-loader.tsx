"use client"

import dynamic from "next/dynamic"

/**
 * The form reads an unsent draft from this browser's storage as its first
 * state, so it only renders client-side. The placeholder holds roughly the
 * form's height so the page doesn't jump when it appears.
 */
export const NewTicketFormLoader = dynamic(
  () => import("./new-ticket-form").then((module) => module.NewTicketForm),
  {
    ssr: false,
    loading: () => (
      <div aria-busy="true" className="min-h-[40rem]">
        <span className="sr-only">Loading the form</span>
      </div>
    ),
  }
)
