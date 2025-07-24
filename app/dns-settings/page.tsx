"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DNSRecord {
  type: string
  name: string
  value: string
  priority?: number
  ttl: number
  description: string
  status: "valid" | "invalid" | "unknown"
}

interface DNSStatus {
  domain: string
  ssl: boolean
  accessible: boolean
  redirects: boolean
  records: DNSRecord[]
  lastChecked: string
}

export default function DNSSettingsPage() {
  const [dnsStatus, setDnsStatus] = useState<DNSStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const requiredRecords: DNSRecord[] = [
    {
      type: "A",
      name: "@",
      value: "76.76.19.61",
      ttl: 300,
      description: "Points your root domain to Vercel servers",
      status: "unknown",
    },
    {
      type: "CNAME",
      name: "www",
      value: "cname.vercel-dns.com",
      ttl: 300,
      description: "Points www subdomain to Vercel",
      status: "unknown",
    },
    {
      type: "MX",
      name: "@",
      value: "mx1.forwardemail.net",
      priority: 10,
      ttl: 300,
      description: "Primary email server for contact@justthedamnrecipe.net",
      status: "unknown",
    },
    {
      type: "MX",
      name: "@",
      value: "mx2.forwardemail.net",
      priority: 20,
      ttl: 300,
      description: "Secondary email server for contact@justthedamnrecipe.net",
      status: "unknown",
    },
    {
      type: "TXT",
      name: "@",
      value: "v=spf1 include:_spf.mx.cloudflare.net ~all",
      ttl: 300,
      description: "SPF record for email authentication",
      status: "unknown",
    },
    {
      type: "TXT",
      name: "_dmarc",
      value: "v=DMARC1; p=quarantine; rua=mailto:contact@justthedamnrecipe.net",
      ttl: 300,
      description: "DMARC policy for email security",
      status: "unknown",
    },
  ]

  const checkDNSStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test/dns-status")
      const data = await response.json()
      setDnsStatus(data)
    } catch (error) {
      console.error("Failed to check DNS status:", error)
      toast({
        title: "Error",
        description: "Failed to check DNS status",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "valid":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "invalid":
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "valid":
        return <Badge className="bg-green-100 text-green-800">Valid</Badge>
      case "invalid":
        return <Badge className="bg-red-100 text-red-800">Invalid</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Unknown</Badge>
    }
  }

  useEffect(() => {
    checkDNSStatus()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">DNS Settings</h1>
          <p className="text-gray-600">Configure DNS records for www.justthedamnrecipe.net</p>
        </div>

        {/* Domain Status Overview */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Domain Status</CardTitle>
              <Button onClick={checkDNSStatus} disabled={loading} size="sm">
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {dnsStatus ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    {getStatusIcon(dnsStatus.accessible ? "valid" : "invalid")}
                  </div>
                  <p className="text-sm font-medium">Domain Access</p>
                  <p className="text-xs text-gray-500">{dnsStatus.accessible ? "Accessible" : "Not Accessible"}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    {getStatusIcon(dnsStatus.ssl ? "valid" : "invalid")}
                  </div>
                  <p className="text-sm font-medium">SSL Certificate</p>
                  <p className="text-xs text-gray-500">{dnsStatus.ssl ? "Valid" : "Invalid"}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    {getStatusIcon(dnsStatus.redirects ? "valid" : "invalid")}
                  </div>
                  <p className="text-sm font-medium">Root Redirect</p>
                  <p className="text-xs text-gray-500">{dnsStatus.redirects ? "Working" : "Not Working"}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <AlertCircle className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="text-sm font-medium">Last Checked</p>
                  <p className="text-xs text-gray-500">{new Date(dnsStatus.lastChecked).toLocaleTimeString()}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Click refresh to check domain status</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* DNS Records */}
        <Card>
          <CardHeader>
            <CardTitle>Required DNS Records</CardTitle>
            <p className="text-sm text-gray-600">Add these records to your domain registrar's DNS settings</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requiredRecords.map((record, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{record.type}</Badge>
                      {getStatusBadge(record.status)}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(record.value, `${record.type} record`)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">Name</p>
                      <p className="font-mono bg-gray-100 px-2 py-1 rounded">{record.name}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Value</p>
                      <p className="font-mono bg-gray-100 px-2 py-1 rounded break-all">{record.value}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">TTL</p>
                      <p className="font-mono bg-gray-100 px-2 py-1 rounded">{record.ttl}</p>
                      {record.priority && (
                        <>
                          <p className="font-medium text-gray-700 mt-2">Priority</p>
                          <p className="font-mono bg-gray-100 px-2 py-1 rounded">{record.priority}</p>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-2">{record.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">1. Access Your Domain Registrar</h3>
                <p className="text-sm text-gray-600">
                  Log into your domain registrar (GoDaddy, Namecheap, etc.) and find the DNS management section.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">2. Add DNS Records</h3>
                <p className="text-sm text-gray-600">
                  Add each record above exactly as shown. Use the copy buttons to avoid typos.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">3. Wait for Propagation</h3>
                <p className="text-sm text-gray-600">
                  DNS changes can take up to 48 hours to propagate worldwide. Use the refresh button to check status.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">4. Verify Configuration</h3>
                <p className="text-sm text-gray-600">Test your domain with these commands:</p>
                <div className="bg-gray-100 p-3 rounded mt-2 font-mono text-sm">
                  <p>dig justthedamnrecipe.net</p>
                  <p>dig www.justthedamnrecipe.net</p>
                  <p>dig MX justthedamnrecipe.net</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
