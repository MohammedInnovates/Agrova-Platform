import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#faf7f0] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-[#15803d] font-bold mb-8 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-[#14532d] mb-4">Contact Agrova</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We are here to help. Whether you have a question about an order, need help with your shopping list, or want to partner with us, reach out to our Abuja team.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* WhatsApp Support */}
          <Card className="border-green-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="h-8 w-8 text-[#25D366]" />
              </div>
              <h2 className="text-xl font-bold text-[#14532d] mb-2">WhatsApp Support</h2>
              <p className="text-gray-500 text-sm mb-6">The fastest way to reach us. Available Mon-Sat, 8am - 6pm.</p>
              <a 
                href="https://wa.me/2348000000000" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-[#25D366] text-white px-6 py-2.5 rounded-full font-bold hover:bg-[#1ebd5a] transition-colors"
              >
                Chat with us
              </a>
            </CardContent>
          </Card>

          {/* Phone Support */}
          <Card className="border-green-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <Phone className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-[#14532d] mb-2">Call Us</h2>
              <p className="text-gray-500 text-sm mb-6">Speak directly with our customer service team.</p>
              <a 
                href="tel:+2348000000000" 
                className="bg-blue-600 text-white px-6 py-2.5 rounded-full font-bold hover:bg-blue-700 transition-colors"
              >
                +234 (0) 800 AGROVA
              </a>
            </CardContent>
          </Card>

          {/* Email Support */}
          <Card className="border-green-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                <Mail className="h-8 w-8 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-[#14532d] mb-2">Email Us</h2>
              <p className="text-gray-500 text-sm mb-6">For partnerships, bulk orders, or general inquiries.</p>
              <a 
                href="mailto:support@agrova.ng" 
                className="bg-purple-600 text-white px-6 py-2.5 rounded-full font-bold hover:bg-purple-700 transition-colors"
              >
                support@agrova.ng
              </a>
            </CardContent>
          </Card>

          {/* Office Address */}
          <Card className="border-green-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                <MapPin className="h-8 w-8 text-orange-500" />
              </div>
              <h2 className="text-xl font-bold text-[#14532d] mb-2">Visit Our Hub</h2>
              <p className="text-gray-500 text-sm mb-6">Our main collection and distribution center in Abuja.</p>
              <p className="font-bold text-gray-800 text-sm">
                Plot 42, Agrova Logistics Hub,<br/>
                Mabushi District, Abuja, FCT.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}