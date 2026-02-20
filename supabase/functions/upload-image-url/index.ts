import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { urls } = await req.json();

    if (!Array.isArray(urls) || urls.length === 0) {
      return new Response(
        JSON.stringify({ error: "urls array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limit batch size
    if (urls.length > 50) {
      return new Response(
        JSON.stringify({ error: "Maximum 50 URLs per request" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const results: { originalUrl: string; storedUrl: string | null; error?: string }[] = [];

    for (const url of urls) {
      if (!url || typeof url !== "string" || !url.startsWith("http")) {
        results.push({ originalUrl: url, storedUrl: null, error: "Invalid URL" });
        continue;
      }

      try {
        // Fetch the external image
        const response = await fetch(url, {
          headers: { "User-Agent": "VetMedix-Import/1.0" },
          signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
          results.push({ originalUrl: url, storedUrl: null, error: `HTTP ${response.status}` });
          continue;
        }

        const contentType = response.headers.get("content-type") || "image/jpeg";
        if (!contentType.startsWith("image/")) {
          results.push({ originalUrl: url, storedUrl: null, error: "Not an image" });
          continue;
        }

        const blob = await response.blob();
        if (blob.size > 5 * 1024 * 1024) {
          results.push({ originalUrl: url, storedUrl: null, error: "Image too large (>5MB)" });
          continue;
        }

        // Determine extension
        const extMap: Record<string, string> = {
          "image/jpeg": "jpg",
          "image/png": "png",
          "image/webp": "webp",
          "image/gif": "gif",
          "image/svg+xml": "svg",
        };
        const ext = extMap[contentType] || "jpg";
        const fileName = `imports/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(fileName, blob, { contentType, upsert: false });

        if (uploadError) {
          results.push({ originalUrl: url, storedUrl: null, error: uploadError.message });
          continue;
        }

        const { data: publicData } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);

        results.push({ originalUrl: url, storedUrl: publicData.publicUrl });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        results.push({ originalUrl: url, storedUrl: null, error: msg });
      }
    }

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("upload-image-url error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
