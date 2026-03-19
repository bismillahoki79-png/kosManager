import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, History, FileText } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function ActivityLogsPage() {
  const supabase = await createClient();

  // Redirect if not logged in or not an owner
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner") {
    redirect("/tenant/dashboard");
  }

  // Fetch all room history logs
  const { data: logs } = await supabase
    .from("room_history")
    .select("*, room:rooms(name), tenant:profiles(full_name, email)")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/owner/dashboard">
                <Button variant="ghost" size="sm" className="px-2 text-slate-500 hover:text-slate-800">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Kembali
                </Button>
              </Link>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 flex items-center">
              <History className="mr-3 h-8 w-8 text-indigo-600" />
              Log Aktivitas Sistem
            </h1>
            <p className="text-slate-500 mt-2 text-lg">Pantau semua perpindahan kamar dan kejadian penting.</p>
          </div>
        </div>

        {/* Logs List Section */}
        <Card className="shadow-md border-slate-200 bg-white overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-5">
            <CardTitle className="text-xl font-bold text-slate-800">Riwayat Kejadian Terbaru</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {logs && logs.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <div key={log.id} className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-900">
                          {log.tenant?.full_name || log.tenant?.email}
                        </span>
                        <Badge variant={log.action === "Moved In" ? "default" : "secondary"}>
                          {log.action}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 flex items-center mt-1">
                        <FileText className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                        {log.notes || "Tanpa catatan"}
                      </p>
                    </div>
                    <div className="md:text-right">
                      <p className="text-sm font-medium text-indigo-600">
                        {log.room?.name || "Kamar tidak diketahui"}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(log.created_at).toLocaleString('id-ID', {
                          dateStyle: 'medium', timeStyle: 'short'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500">
                <History className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                <p>Belum ada rekaman aktivitas.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
