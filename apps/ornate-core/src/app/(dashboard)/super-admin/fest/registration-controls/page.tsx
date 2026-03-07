"use client";
import {
  CreditCard,
  Calendar,
  Settings,
  AlertCircle,
  Save,
} from "lucide-react";
import { InfoTooltip } from "@/components/InfoTooltip";
import { useToast } from "@/hooks/useToast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RegistrationControlsPage() {
  const { showToast } = useToast();
  return (
    <div className="p-6 md:p-8 max-w-[1000px] mx-auto">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#1A1A1A]">
                Registration Logic
              </h1>
              <InfoTooltip
                text="Configure global registration rules and limitations"
                size="md"
              />
            </div>
            <p className="text-sm text-[#6B7280]">
              Configure payment gateways, fees, and registration constraints.
            </p>
          </div>
          <button
            onClick={() =>
              showToast("Registration settings saved successfully", "success")
            }
            className="flex items-center gap-2 px-6 py-2.5 bg-[#1A1A1A] text-white rounded-xl text-sm font-medium hover:bg-[#2D2D2D] transition-colors shadow-lg shadow-gray-200"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Early Bird Configuration */}
        <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
          <div className="bg-white rounded-[14px] p-6">
            <h3 className="font-bold text-[#1A1A1A] flex items-center gap-2 mb-6">
              <Calendar className="w-5 h-5 text-gray-500" />
              Timeline Constraints
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="flex items-center gap-3 p-4 border border-indigo-100 bg-indigo-50 rounded-xl cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    className="w-4 h-4 text-indigo-600"
                    defaultChecked
                  />
                  <div>
                    <div className="font-semibold text-indigo-900">
                      Standard Mode
                    </div>
                    <div className="text-xs text-indigo-600">
                      Registration is open to all
                    </div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="mode"
                    className="w-4 h-4 text-gray-400"
                  />
                  <div>
                    <div className="font-semibold text-[#1A1A1A]">
                      Waitlist Only
                    </div>
                    <div className="text-xs text-gray-500">
                      Queue users for approval
                    </div>
                  </div>
                </label>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#1A1A1A] mb-1 block">
                    Registration Deadline
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1A1A1A] mb-1 block">
                    Max Participants (Global)
                  </label>
                  <input
                    type="number"
                    placeholder="Unlimited"
                    className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Gateway */}
        <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
          <div className="bg-white rounded-[14px] p-6">
            <h3 className="font-bold text-[#1A1A1A] flex items-center gap-2 mb-6">
              <CreditCard className="w-5 h-5 text-gray-500" />
              Payment Settings
            </h3>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                <div>
                  <div className="font-semibold text-[#1A1A1A]">
                    Enable Payments
                  </div>
                  <div className="text-sm text-gray-500">
                    Collect fees via Razorpay/Stripe
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A1A1A]"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-50 pointer-events-none">
                <div>
                  <label className="text-sm font-medium text-[#1A1A1A] mb-1 block">
                    Currency
                  </label>
                  <Select defaultValue="INR (₹)">
                    <SelectTrigger className="w-full px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#1A1A1A]">
                      <SelectValue placeholder="INR (₹)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR (₹)">INR (₹)</SelectItem>
                      <SelectItem value="USD ($)">USD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1A1A1A] mb-1 block">
                    Platform Fee (%)
                  </label>
                  <input
                    type="number"
                    defaultValue="2.5"
                    className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded-lg flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Enable payments to configure gateway credentials.
              </div>
            </div>
          </div>
        </div>

        {/* Form Customization */}
        <div className="bg-[#F4F2F0] rounded-[18px] p-[10px]">
          <div className="bg-white rounded-[14px] p-6">
            <h3 className="font-bold text-[#1A1A1A] flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-gray-500" />
              Required Fields
            </h3>

            <div className="space-y-2">
              {[
                "Student ID",
                "Phone Number",
                "College Name",
                "Year of Study",
                "T-Shirt Size",
              ].map((field: any, i: any) => (
                <label key={i} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 text-[#1A1A1A] rounded"
                  />
                  <span className="text-sm text-gray-700">{field}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
