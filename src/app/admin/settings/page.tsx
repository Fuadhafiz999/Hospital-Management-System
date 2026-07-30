"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

type SettingTab = "general" | "security" | "notifications" | "integrations";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingTab>("general");

  const tabs: { key: SettingTab; label: string }[] = [
    { key: "general", label: "General" },
    { key: "security", label: "Security" },
    { key: "notifications", label: "Notifications" },
    { key: "integrations", label: "Integrations" },
  ];

  return (
    <div>
      <Header title="Settings" subtitle="System configuration and preferences" userName="Admin User" userRole="admin" showSearch={false} />

      <div className="page-container space-y-6">
        {/* Tabs */}
        <div className="flex items-center gap-1 rounded-lg bg-secondary-100 p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.key ? "bg-white text-secondary-900 shadow-sm" : "text-secondary-500 hover:text-secondary-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "general" && (
          <div className="space-y-6 max-w-2xl">
            <Card>
              <CardHeader><CardTitle>Hospital Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-secondary-700">Hospital Name</label>
                  <input type="text" defaultValue="HospiTrack Medical Center" className="input-field" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-secondary-700">Address</label>
                  <input type="text" defaultValue="123 Healthcare Ave, Medical District" className="input-field" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-secondary-700">Phone</label>
                  <input type="text" defaultValue="+1 (555) 000-0000" className="input-field" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-secondary-700">Email</label>
                  <input type="email" defaultValue="contact@hospitrack.com" className="input-field" />
                </div>
                <div className="pt-2"><Button>Save Changes</Button></div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-6 max-w-2xl">
            <Card>
              <CardHeader><CardTitle>Security Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-medium text-secondary-900">Two-Factor Authentication</p><p className="text-xs text-secondary-500">Add an extra layer of security</p></div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" className="peer sr-only" />
                    <div className="h-6 w-11 rounded-full bg-secondary-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary-600 peer-checked:after:translate-x-full" />
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-medium text-secondary-900">Session Timeout</p><p className="text-xs text-secondary-500">Auto-logout after inactivity</p></div>
                  <select className="rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm">
                    <option>30 minutes</option><option>1 hour</option><option>2 hours</option><option>Never</option>
                  </select>
                </div>
                <div className="pt-2"><Button variant="danger">Change Password</Button></div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-6 max-w-2xl">
            <Card>
              <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {["New Appointments", "Payment Received", "Lab Results Ready", "Staff Updates"].map((item) => (
                  <div key={item} className="flex items-center justify-between">
                    <p className="text-sm font-medium text-secondary-900">{item}</p>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input type="checkbox" defaultChecked className="peer sr-only" />
                      <div className="h-6 w-11 rounded-full bg-secondary-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary-600 peer-checked:after:translate-x-full" />
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "integrations" && (
          <div className="space-y-6 max-w-2xl">
            <Card>
              <CardHeader><CardTitle>System Integrations</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: "Email Service", desc: "SendGrid / SMTP", status: "Connected" as const },
                  { name: "SMS Gateway", desc: "Twilio", status: "Disconnected" as const },
                  { name: "Payment Gateway", desc: "Stripe", status: "Connected" as const },
                  { name: "Cloud Backup", desc: "AWS S3", status: "Connected" as const },
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between rounded-lg border border-secondary-200 p-4">
                    <div>
                      <p className="text-sm font-medium text-secondary-900">{item.name}</p>
                      <p className="text-xs text-secondary-500">{item.desc}</p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${item.status === "Connected" ? "bg-success-50 text-success-700" : "bg-danger-50 text-danger-700"}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
