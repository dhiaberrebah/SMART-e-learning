'use client'

import { deleteEvent } from './actions'

export function DeleteEventButton({ eventId }: { eventId: string }) {
  return (
    <form
      action={deleteEvent}
      onSubmit={(e) => {
        if (!confirm('Supprimer définitivement cet événement ?')) e.preventDefault()
      }}
    >
      <input type="hidden" name="event_id" value={eventId} />
      <button
        type="submit"
        className="text-xs text-red-500 hover:text-red-700 px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
      >
        Supprimer
      </button>
    </form>
  )
}
