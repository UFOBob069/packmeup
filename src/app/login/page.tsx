import { LoginClient } from "./login-client";
import { getTripPreviewByShareToken } from "@/actions/trips";
import { destinationCity } from "@/lib/invite-share";

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

function extractJoinToken(nextPath: string): string | null {
  const match = nextPath.match(/^\/(?:api\/)?trips\/join\/([^/?#]+)/);
  return match?.[1] ?? null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  const nextPath = next?.startsWith("/") ? next : "/dashboard";
  const joinToken = extractJoinToken(nextPath);
  const preview = joinToken ? await getTripPreviewByShareToken(joinToken) : null;

  return (
    <LoginClient
      nextPath={nextPath}
      invite={
        preview
          ? {
              inviterName: preview.inviter_name,
              destination: preview.destination,
              city: destinationCity(preview.destination),
              coverImageUrl: preview.cover_image_url,
              startDate: preview.start_date,
              endDate: preview.end_date,
            }
          : null
      }
    />
  );
}
