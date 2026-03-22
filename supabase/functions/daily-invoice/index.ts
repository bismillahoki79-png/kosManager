import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

Deno.serve(async (req) => {
  try {
    // Verify authorization - only allow internal calls or specific API key
    const authHeader = req.headers.get("Authorization");
    const expectedKey = Deno.env.get("INVOICE_CRON_KEY");

    if (!authHeader || !expectedKey || authHeader !== `Bearer ${expectedKey}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Call the PostgreSQL function to generate pending invoices
    const { data, error } = await supabase.rpc("generate_pending_invoices");

    if (error) {
      console.error("Error calling generate_pending_invoices:", error);
      return new Response(
        JSON.stringify({
          error: error.message || "Failed to generate invoices",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const result = {
      message: "Daily invoice generation completed",
      invoices_created: data?.length || 0,
      details: data || [],
      timestamp: new Date().toISOString(),
    };

    console.log("Invoice generation result:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
