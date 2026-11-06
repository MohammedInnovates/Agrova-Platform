"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { koboToNaira } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, ShieldCheck, CreditCard } from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

type CustomList = {
  id: string;
  status: string;
  raw_text: string;
  quoted_total_kobo: number | null;
  admin_notes: string | null;
  parsed_items: any;
  generated_order_id: string | null;
};

export default function CustomListDetailClient() {
  const params = useParams();
  const router = useRouter();
  const listId = params?.id as string;

  const [list, setList] = useState<CustomList | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchList = async () => {
    try {
      const res = await fetch(`${API_URL}/custom-lists/${listId}`);
      if (!res.ok) throw new Error("List not found");
      const data = await res.json();
      setList(data);
    } catch (err) {
      toast.error("Failed to load list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (listId) fetchList();
  }, [listId]);

  const handleAdminQuote = async () => {
    setActionLoading(true);
    try {
      const estimatedTotal =
        list?.parsed_items?.estimated_total_kobo ??
        list?.quoted_total_kobo ??
        18525000;

      const res = await fetch(`${API_URL}/custom-lists/${listId}/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoted_items: [
            {
              name: "Admin Confirmed Items",
              qty: 1,
              unit: "bulk",
              price_kobo: estimatedTotal,
            },
          ],
          quoted_total_kobo: estimatedTotal,
          admin_notes:
            "Admin approved. Prices verified. Delivery this Saturday.",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : JSON.stringify(data.detail)
        );
      }

      toast.success("Admin has quoted the list!");
      fetchList();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to quote");
      console.error("Quote error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptQuote = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/custom-lists/${listId}/accept`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : JSON.stringify(data.detail)
        );
      }
      toast.success("Quote accepted! Order created.");
      router.push(`/orders/${data.order_id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error accepting quote");
      console.error("Accept error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!list) return <div className="text-center py-12">List not found.</div>;

  return (
    <div className="space-y-6">
      <Card className="bg-white border-2 border-[#15803d]">
        <CardContent className="p-6 flex items-start gap-4">
          <div className="bg-[#15803d] text-white p-3 rounded-full">
            {list.status === "ACCEPTED" ? <CheckCircle2 /> : <Clock />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#14532d]">
              Status: {list.status.replace("_", " ")}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {list.status === "PENDING_QUOTE" &&
                "Our team is reviewing your list and will send a final quote shortly."}
              {list.status === "QUOTED" &&
                "Your quote is ready! Please accept to proceed to checkout."}
              {list.status === "ACCEPTED" &&
                "You accepted the quote. Order has been generated."}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Raw Request</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-4 rounded-md border">
            {list.raw_text}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {list.status === "PENDING_QUOTE" && (
            <div className="bg-orange-50 text-orange-800 p-4 rounded-md text-sm mb-4">
              ⏳ Waiting for Admin. Use the button below to simulate the admin
              finalizing the quote.
            </div>
          )}
          {list.status === "PENDING_QUOTE" && (
            <Button
              onClick={handleAdminQuote}
              disabled={actionLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              {actionLoading ? "Quoting..." : "[Demo] Simulate Admin Quote"}
            </Button>
          )}
          {list.status === "QUOTED" && (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-md">
                <p className="text-sm font-semibold text-green-800">
                  Admin Notes:
                </p>
                <p className="text-sm text-green-700">{list.admin_notes}</p>
                <p className="text-2xl font-bold text-[#15803d] mt-2">
                  {koboToNaira(list.quoted_total_kobo || 0)}
                </p>
              </div>
              <Button
                onClick={handleAcceptQuote}
                disabled={actionLoading}
                className="w-full h-12 bg-[#15803d] hover:bg-[#14532d]"
              >
                <CreditCard className="mr-2 h-5 w-5" />
                {actionLoading
                  ? "Creating order..."
                  : "Accept Quote & Proceed to Payment"}
              </Button>
            </div>
          )}
          {list.status === "ACCEPTED" && (
            <div className="text-center">
              <p className="text-green-600 font-semibold mb-2">
                ✅ Quote Accepted!
              </p>
              <Button
                onClick={() =>
                  router.push(`/orders/${list.generated_order_id}`)
                }
              >
                View Generated Order
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}