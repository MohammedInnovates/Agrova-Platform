"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { koboToNaira } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Camera,
  Mic,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShoppingBasket,
  Sparkles,
} from "lucide-react";

// Your seeded test user
const TEST_USER_ID = "1f098b2b-4941-440f-aae6-7cac16959694";

type Tab = "text" | "photo" | "voice";

type ParsedItem = {
  raw_text: string;
  product_name: string | null;
  product_brand: string | null;
  quantity: number;
  unit_kind: string;
  unit_price_kobo: number;
  line_total_kobo: number;
  note: string | null;
};

type QuoteResult = {
  id: string;
  status: string;
  items: ParsedItem[];
  unmatched: string[];
  estimated_total_kobo: number;
  message: string;
};

export default function CustomListClient() {
  const [activeTab, setActiveTab] = useState<Tab>("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuoteResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (activeTab === "text" && !text.trim()) {
      toast.error("Please type your shopping list first");
      return;
    }
    if (activeTab !== "text" && !file) {
      toast.error(
        `Please upload a ${activeTab === "photo" ? "photo" : "voice note"} first`
      );
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      let payloadText = text;
      let sourceType = "TEXT";

      if (activeTab === "photo") {
        payloadText = "2 bags of Royal Stallion Rice, 1 keg of Kings oil";
        sourceType = "IMAGE";
      } else if (activeTab === "voice") {
        payloadText = "5 dericas of beans, 2 bags of rice";
        sourceType = "AUDIO";
      }

      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
        }/custom-lists/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: TEST_USER_ID,
            raw_text: payloadText,
            source_type: sourceType,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to parse list");
      }

      const data = await res.json();
      setResult(data);
      toast.success("List parsed successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-[#14532d]">
              How are you sending your list?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 mb-6">
              <button
                onClick={() => setActiveTab("text")}
                className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                  activeTab === "text"
                    ? "border-[#15803d] bg-green-50 text-[#15803d]"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <FileText className="h-5 w-5" />
                <span className="text-xs font-semibold">Type Text</span>
              </button>
              <button
                onClick={() => setActiveTab("photo")}
                className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                  activeTab === "photo"
                    ? "border-[#15803d] bg-green-50 text-[#15803d]"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <Camera className="h-5 w-5" />
                <span className="text-xs font-semibold">Snap Photo</span>
              </button>
              <button
                onClick={() => setActiveTab("voice")}
                className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                  activeTab === "voice"
                    ? "border-[#15803d] bg-green-50 text-[#15803d]"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <Mic className="h-5 w-5" />
                <span className="text-xs font-semibold">Voice Note</span>
              </button>
            </div>

            {activeTab === "text" && (
              <div className="space-y-3">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="e.g. 2 bags of Royal Stallion Rice, 5 dericas of beans, 1 keg of Kings oil..."
                  className="w-full h-40 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-[#15803d] focus:border-transparent outline-none"
                />
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-gray-500">Try:</span>
                  <button
                    onClick={() => setText("2 bags of Royal Stallion Rice")}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                  >
                    2 bags of Rice
                  </button>
                  <button
                    onClick={() => setText("5 dericas of beans")}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                  >
                    5 Dericas Beans
                  </button>
                </div>
              </div>
            )}

            {activeTab === "photo" && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-3" />
                <p className="font-semibold text-gray-700">
                  {file ? file.name : "Tap to upload or snap a photo"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Upload a handwritten list or screenshot
                </p>
              </div>
            )}

            {activeTab === "voice" && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <input
                  type="file"
                  accept="audio/*"
                  capture="user"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <Mic className="h-8 w-8 mx-auto text-gray-400 mb-3" />
                <p className="font-semibold text-gray-700">
                  {file ? file.name : "Tap to record a voice note"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Speak your list in English, Pidgin, or Hausa
                </p>
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full h-12 mt-6 bg-[#15803d] hover:bg-[#14532d] text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  AI is parsing your list...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Get Instant Quote
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div>
        {!result ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-gray-300 rounded-xl bg-white opacity-60">
            <ShoppingBasket className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-400">
              Your instant quote will appear here
            </h3>
            <p className="text-sm text-gray-400 mt-2">
              Submit a list to see the magic happen.
            </p>
          </div>
        ) : (
          <Card className="border-[#15803d] shadow-lg">
            <CardHeader className="bg-[#15803d] text-white rounded-t-lg pb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <CardTitle className="text-white">Instant AI Quote</CardTitle>
              </div>
              <p className="text-green-100 text-sm mt-1">
                Status: {result.status}
              </p>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-3">
                {result.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-start border-b border-gray-100 pb-3 last:border-0"
                  >
                    <div>
                      <p className="font-semibold text-[#14532d] text-sm">
                        {item.product_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.quantity} × {item.unit_kind} @{" "}
                        {koboToNaira(item.unit_price_kobo)}
                      </p>
                    </div>
                    <p className="font-bold text-[#15803d] text-sm">
                      {koboToNaira(item.line_total_kobo)}
                    </p>
                  </div>
                ))}
              </div>

              {result.unmatched.length > 0 && (
                <div className="bg-orange-50 p-3 rounded-md border border-orange-200 mt-4">
                  <p className="text-xs font-semibold text-orange-800 flex items-center gap-1 mb-1">
                    <AlertCircle className="h-3 w-3" />
                    We couldn't find these in the catalog:
                  </p>
                  <ul className="text-xs text-orange-700 list-disc pl-4">
                    {result.unmatched.map((u, i) => (
                      <li key={i}>{u}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border-t border-gray-200 pt-3 flex justify-between items-center mt-4">
                <span className="font-bold text-[#14532d]">
                  Total Estimate
                </span>
                <span className="text-2xl font-bold text-[#15803d]">
                  {koboToNaira(result.estimated_total_kobo)}
                </span>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg text-center mt-4">
                <p className="text-sm text-gray-600 mb-3">
                  Our admin team will review this list and send a final quote
                  to your WhatsApp.
                </p>
                <Button
                  onClick={() =>
                    (window.location.href = `/custom-list/${result.id}`)
                  }
                  className="w-full bg-[#14532d] hover:bg-[#15803d]"
                >
                  View Full Quote Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}