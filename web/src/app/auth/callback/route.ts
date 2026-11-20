import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient, landing } from "@/lib/supabase/server";

/** Landing page for email confirmation links: signs the user in, then opens the dashboard. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next");
  const dest = next && /^\/(?![/\\])/.test(next) ? next : "/dashboard"; // same-site paths only

  const supabase = await createClient();
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("missing code") };

  if (error) return NextResponse.redirect(`${origin}/login?error=link`);
  // Google sign-ups have no mobile or company yet: profile form first
  const { data } = await supabase.auth.getUser();
  return NextResponse.redirect(`${origin}${data.user ? await landing(supabase, data.user.id, dest) : dest}`);
}
