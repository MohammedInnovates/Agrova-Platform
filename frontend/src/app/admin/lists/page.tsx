"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { koboToNaira, fetchWithAuth } from "@/lib/api"; // <-- IMPORTED fetchWithAuth
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, Send, Loader2, RefreshCw, MessageCircle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

type CustomList = {
  id: string;
  user_id: string;
  raw_text: string;
  source_type: string;
  status: string;
  quoted_total_kobo: number | null;
  created_at: string;
};

export default function AdminListsClient() {
  const router = useRouter();
  const [lists, setLists] = useState<CustomList[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadLists = async () => {
    try {
      // <-- SWAPPED TO fetchWithAuth -->
      const res = await fetchWithAuth(`${API_URL}/custom-lists/pending`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setLists(data);
    } catch (err) {
      toast.error("Failed to load lists. Ensure you are logged in as Admin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLists(); }, []);

  const handleQuote = async (list: CustomList) => {
    setActionLoading(list.id);
    try {
      const estimatedTotal = list.quoted_total_kobo || 18525000;

      // <-- SWAPPED TO fetchWithAuth -->
      const res = await fetchWithAuth(`${API_URL}/custom-lists/${list.id}/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoted_items: [
            { name: "Admin Confirmed Items", qty: 1, unit: "bulk", price_kobo: estimatedTotal }
          ],
          quoted_total_kobo: estimatedTotal,
          admin_notes: "Admin approved. Prices verified. Delivery this Saturday.",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to quote");
      }

      toast.success("Quote sent! User notified via WhatsApp.");
      loadLists();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to quote");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />)}</div>;

  if (lists.length === 0) {
    return (
      <div className="text-center py-16">
        <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
        <h3 className="text-xl font-bold text-[#14532d] mb-2">Inbox is clear!</h3>
        <p className="text-gray-500 mb-6">No pending custom lists. Great work.</p>
        <Button onClick={loadLists} variant="outline"><RefreshCw className="h-4 w-4 mr-2" /> Refresh</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600"><strong>{lists.length}</strong> pending list{lists.length !== 1 ? "s" : ""} awaiting quote</p>
        <Button onClick={loadLists} variant="outline" size="sm"><RefreshCw className="h-4 w-4 mr-2" /> Refresh</Button>
      </div>

      {lists.map((list) => (
        <Card key={list.id} className="border-orange-200 bg-orange-50/30">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="text-lg text-[#14532d] flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  List #{list.id.slice(0, 8)}
                  <Badge variant="outline"><MessageCircle className="h-3 w-3 mr-1" />{list.source_type}</Badge>
                </CardTitle>
                <p className="text-xs text-gray-500 mt-1">{new Date(list.created_at).toLocaleString()}</p>
              </div>
              {list.quoted_total_kobo && (
                <div className="text-right">
                  <p className="text-xs text-gray-500">Estimated</p>
                  <p className="text-lg font-bold text-[#15803d]">{koboToNaira(list.quoted_total_kobo)}</p>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1 font-semibold">Customer&apos;s list:</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{list.raw_text}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => handleQuote(list)} disabled={actionLoading === list.id} className="bg-[#15803d] hover:bg-[#14532d]">
                {actionLoading === list.id ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</> : <><Send className="h-4 w-4 mr-2" />Approve & Send Quote</>}
              </Button>
              <Button variant="outline" onClick={() => navigator.clipboard.writeText(list.raw_text).then(() => toast.success("List copied!"))}>
                Copy List
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}