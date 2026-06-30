"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Template {
  id: string;
  name: string;
  channel: string;
  content: string;
}

interface Contact {
  id: string;
  phone: string | null;
  email: string | null;
  whatsappId: string | null;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    channel: "sms",
    templateId: "",
    customMessage: "",
    subject: "",
    recipientType: "all",
    tags: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [templatesRes, contactsRes] = await Promise.all([
          fetch("/api/templates"),
          fetch("/api/contacts"),
        ]);

        if (templatesRes.ok) {
          const templatesData = await templatesRes.json();
          setTemplates(templatesData);
        }

        if (contactsRes.ok) {
          const contactsData = await contactsRes.json();
          setContacts(contactsData);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  const filteredTemplates = templates.filter(
    (t) => t.channel === formData.channel
  );

  const selectedTemplate = templates.find((t) => t.id === formData.templateId);

  const eligibleContacts = contacts.filter((c) => {
    if (formData.channel === "sms") return c.phone;
    if (formData.channel === "email") return c.email;
    if (formData.channel === "whatsapp") return c.whatsappId;
    return false;
  });

  const recipientCount = eligibleContacts.length;

  const channelCosts = {
    sms: 0.8,
    email: 0.1,
    whatsapp: 0.5,
  };

  let costPerMessage = channelCosts[formData.channel as keyof typeof channelCosts];

  if (formData.channel === "sms") {
    const message = formData.templateId && selectedTemplate
      ? selectedTemplate.content
      : formData.customMessage;
    const smsCount = Math.ceil(message.length / 160);
    costPerMessage = channelCosts.sms * smsCount;
  }

  const totalCost = recipientCount * costPerMessage;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (recipientCount === 0) {
      setError(
        `No contacts have ${formData.channel === "sms" ? "phone numbers" : formData.channel === "email" ? "email addresses" : "WhatsApp IDs"}`
      );
      return;
    }

    const message =
      formData.templateId && selectedTemplate
        ? selectedTemplate.content
        : formData.customMessage;

    if (!message) {
      setError("Please select a template or enter a custom message");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          channel: formData.channel,
          templateId: formData.templateId || null,
          message,
          subject: formData.channel === "email" ? formData.subject : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create campaign");
      }

      router.push(`/dashboard/campaigns/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard/campaigns"
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          ← Back to Campaigns
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Create Campaign
        </h1>
        <p className="text-gray-600 mb-6">
          Send bulk messages to your contacts
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Campaign Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Summer Sale Announcement"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Channel *
            </label>
            <select
              value={formData.channel}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  channel: e.target.value,
                  templateId: "",
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="sms">📱 SMS - KES 0.80 per message</option>
              <option value="email">✉️ Email - KES 0.10 per message</option>
              <option value="whatsapp">💬 WhatsApp - KES 0.50 per message</option>
            </select>
          </div>

          {formData.channel === "email" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Subject *
              </label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Your email subject line"
              />
            </div>
          )}

          {filteredTemplates.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Template (Optional)
              </label>
              <select
                value={formData.templateId}
                onChange={(e) =>
                  setFormData({ ...formData, templateId: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">-- Use custom message --</option>
                {filteredTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              {selectedTemplate && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 font-mono">
                    {selectedTemplate.content}
                  </p>
                </div>
              )}
            </div>
          )}

          {!formData.templateId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message Content *
              </label>
              <textarea
                required={!formData.templateId}
                value={formData.customMessage}
                onChange={(e) =>
                  setFormData({ ...formData, customMessage: e.target.value })
                }
                rows={formData.channel === "email" ? 8 : 5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                placeholder={
                  formData.channel === "email"
                    ? "Enter email content (HTML supported)..."
                    : "Enter your message here..."
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.customMessage.length} characters
                {formData.channel === "sms" &&
                  ` (${Math.ceil(formData.customMessage.length / 160)} SMS)`}
              </p>
              {formData.channel === "email" && (
                <p className="text-xs text-blue-600 mt-1">
                  💡 You can use HTML tags for formatting (e.g., &lt;b&gt;bold&lt;/b&gt;, &lt;p&gt;paragraph&lt;/p&gt;)
                </p>
              )}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">
              Campaign Summary
            </h3>
            <div className="space-y-1 text-sm text-blue-800">
              <p>
                <span className="font-medium">Channel:</span>{" "}
                {formData.channel.toUpperCase()}
              </p>
              <p>
                <span className="font-medium">Recipients:</span>{" "}
                {recipientCount} contacts
              </p>
              <p>
                <span className="font-medium">Cost per message:</span> KES{" "}
                {costPerMessage.toFixed(2)}
              </p>
              <p>
                <span className="font-medium">Total Cost:</span> KES{" "}
                {totalCost.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={loading || recipientCount === 0}
              className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create & Send Campaign"}
            </button>
            <Link
              href="/dashboard/campaigns"
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
