"use client";

import React from "react";
import Header from "@/components/layout/Header";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function PatientProfilePage() {
  return (
    <div>
      <Header title="My Profile" subtitle="Manage your personal information" userName="Sarah Johnson" userRole="patient" showSearch={false} />

      <div className="page-container space-y-6 max-w-2xl">
        {/* Profile Info */}
        <Card>
          <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-secondary-100">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-xl font-bold text-white">SJ</div>
              <div>
                <h2 className="text-lg font-semibold text-secondary-900">Sarah Johnson</h2>
                <p className="text-sm text-secondary-500">Patient</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-secondary-700">Full Name</label>
                <input type="text" defaultValue="Sarah Johnson" className="input-field" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-secondary-700">Email</label>
                <input type="email" defaultValue="sarah.j@email.com" className="input-field" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-secondary-700">Phone</label>
                <input type="tel" defaultValue="+1 (555) 123-4567" className="input-field" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-secondary-700">Date of Birth</label>
                <input type="date" defaultValue="1990-05-15" className="input-field" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-secondary-700">Blood Type</label>
                <input type="text" defaultValue="A+" className="input-field" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-secondary-700">Gender</label>
                <select className="input-field">
                  <option>Female</option>
                  <option>Male</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-700">Address</label>
              <input type="text" defaultValue="456 Oak Avenue, Medical District" className="input-field" />
            </div>

            <div className="pt-2"><Button>Save Changes</Button></div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader><CardTitle>Account Security</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-900">Change Password</p>
                <p className="text-xs text-secondary-500">Update your account password</p>
              </div>
              <Button variant="secondary">Change</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-900">Two-Factor Auth</p>
                <p className="text-xs text-secondary-500">Add extra security to your account</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" className="peer sr-only" />
                <div className="h-6 w-11 rounded-full bg-secondary-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary-600 peer-checked:after:translate-x-full" />
              </label>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
