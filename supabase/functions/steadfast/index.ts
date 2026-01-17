import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Supabase configuration missing");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the token and get user
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("Auth claims error:", claimsError);
      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;
    console.log("Authenticated user:", userId);

    // Check if user is admin
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    
    const isAdmin = userRoles?.some((r) => r.role === "admin") ?? false;

    const apiKey = Deno.env.get("STEADFAST_API_KEY");
    const secretKey = Deno.env.get("STEADFAST_SECRET_KEY");

    if (!apiKey || !secretKey) {
      return new Response(
        JSON.stringify({ error: "Steadfast API credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, ...params } = await req.json();
    console.log("Action requested:", action, "by user:", userId, "isAdmin:", isAdmin);

    const headers = {
      "Api-Key": apiKey,
      "Secret-Key": secretKey,
      "Content-Type": "application/json",
    };

    let response;
    let result;

    switch (action) {
      case "track_by_consignment": {
        const { consignment_id } = params;
        
        // Validate input
        if (!consignment_id || typeof consignment_id !== "string") {
          return new Response(
            JSON.stringify({ error: "Invalid consignment ID" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify user owns this order or is admin
        const { data: order } = await supabase
          .from("orders")
          .select("id, user_id")
          .eq("consignment_id", consignment_id)
          .single();

        if (!order) {
          return new Response(
            JSON.stringify({ error: "Order not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (order.user_id !== userId && !isAdmin) {
          return new Response(
            JSON.stringify({ error: "Unauthorized to track this order" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        response = await fetch(`${STEADFAST_BASE_URL}/status_by_cid/${encodeURIComponent(consignment_id)}`, {
          method: "GET",
          headers,
        });
        result = await response.json();
        break;
      }

      case "track_by_tracking_code": {
        const { tracking_code } = params;
        
        // Validate input
        if (!tracking_code || typeof tracking_code !== "string") {
          return new Response(
            JSON.stringify({ error: "Invalid tracking code" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify user owns this order or is admin
        const { data: order } = await supabase
          .from("orders")
          .select("id, user_id")
          .eq("tracking_id", tracking_code)
          .single();

        if (!order) {
          return new Response(
            JSON.stringify({ error: "Order not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (order.user_id !== userId && !isAdmin) {
          return new Response(
            JSON.stringify({ error: "Unauthorized to track this order" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        response = await fetch(`${STEADFAST_BASE_URL}/status_by_trackingcode/${encodeURIComponent(tracking_code)}`, {
          method: "GET",
          headers,
        });
        result = await response.json();
        break;
      }

      case "track_by_invoice": {
        const { invoice } = params;
        
        // Validate input
        if (!invoice || typeof invoice !== "string") {
          return new Response(
            JSON.stringify({ error: "Invalid invoice ID" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // For invoice tracking, verify user owns an order with this invoice (order id) or is admin
        const { data: order } = await supabase
          .from("orders")
          .select("id, user_id")
          .eq("id", invoice)
          .single();

        if (!order) {
          return new Response(
            JSON.stringify({ error: "Order not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (order.user_id !== userId && !isAdmin) {
          return new Response(
            JSON.stringify({ error: "Unauthorized to track this order" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        response = await fetch(`${STEADFAST_BASE_URL}/status_by_invoice/${encodeURIComponent(invoice)}`, {
          method: "GET",
          headers,
        });
        result = await response.json();
        break;
      }

      case "create_order": {
        // Admin only action
        if (!isAdmin) {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { invoice, recipient_name, recipient_phone, recipient_address, cod_amount, note } = params;
        
        // Validate required inputs
        if (!invoice || !recipient_name || !recipient_phone || !recipient_address) {
          return new Response(
            JSON.stringify({ error: "Missing required order fields" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Validate phone format (basic check)
        if (typeof recipient_phone !== "string" || recipient_phone.length < 10) {
          return new Response(
            JSON.stringify({ error: "Invalid phone number" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        response = await fetch(`${STEADFAST_BASE_URL}/create_order`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            invoice: String(invoice).slice(0, 100), // Limit length
            recipient_name: String(recipient_name).slice(0, 200),
            recipient_phone: String(recipient_phone).slice(0, 20),
            recipient_address: String(recipient_address).slice(0, 500),
            cod_amount: Number(cod_amount) || 0,
            note: note ? String(note).slice(0, 500) : undefined,
          }),
        });
        result = await response.json();
        console.log("Order created by admin:", userId, "invoice:", invoice);
        break;
      }

      case "get_balance": {
        // Admin only action
        if (!isAdmin) {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        response = await fetch(`${STEADFAST_BASE_URL}/get_balance`, {
          method: "GET",
          headers,
        });
        result = await response.json();
        console.log("Balance checked by admin:", userId);
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
