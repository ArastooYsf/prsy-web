import { redirect } from "next/navigation";

// Moved to /account/settings (see that page for why) — kept as a redirect
// rather than deleting the route outright, in case anything still links or
// is bookmarked here.
export default function AccountProfileRedirectPage() {
  redirect("/account/settings");
}
