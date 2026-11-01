import { permanentRedirect } from "next/navigation"

export default function ClientInvoicesPage() {
  permanentRedirect("/dashboard/billing")
}
