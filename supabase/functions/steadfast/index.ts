import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STEADFAST_BASE_URL = "https://portal.packzy.com/api/v1";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("STEADFAST_API_KEY");
    const secretKey = Deno.env.get("STEADFAST_SECRET_KEY");

    if (!apiKey || !secretKey) {
      return new Response(
        JSON.stringify({ error: "Steadfast API credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, ...params } = await req.json();

    const headers = {
      "Api-Key": apiKey,
      "Secret-Key": secretKey,
      "Content-Type": "application/json",
    };

    let response;
    let result;

    switch (action) {
      case "track_by_consignment": {
        // Track by consignment ID
        const { consignment_id } = params;
        response = await fetch(`${STEADFAST_BASE_URL}/status_by_cid/${consignment_id}`, {
          method: "GET",
          headers,
        });
        result = await response.json();
        break;
      }

      case "track_by_tracking_code": {
        // Track by tracking code
        const { tracking_code } = params;
        response = await fetch(`${STEADFAST_BASE_URL}/status_by_trackingcode/${tracking_code}`, {
          method: "GET",
          headers,
        });
        result = await response.json();
        break;
      }

      case "track_by_invoice": {
        // Track by invoice ID
        const { invoice } = params;
        response = await fetch(`${STEADFAST_BASE_URL}/status_by_invoice/${invoice}`, {
          method: "GET",
          headers,
        });
        result = await response.json();
        break;
      }

      case "create_order": {
        // Create a new order in Steadfast
        const { invoice, recipient_name, recipient_phone, recipient_address, cod_amount, note } = params;
        response = await fetch(`${STEADFAST_BASE_URL}/create_order`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            invoice,
            recipient_name,
            recipient_phone,
            recipient_address,
            cod_amount,
            note,
          }),
        });
        result = await response.json();
        break;
      }

      case "get_balance": {
        response = await fetch(`${STEADFAST_BASE_URL}/get_balance`, {
          method: "GET",
          headers,
        });
        result = await response.json();
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Steadfast API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
