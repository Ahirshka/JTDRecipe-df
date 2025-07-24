"use client"

import { useState } from "react"
import { Share2, Facebook, Instagram, Mail, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

interface RecipeShareProps {
  recipe: {
    id: string
    title: string
    description: string
    image?: string
    author: string
  }
  className?: string
}

export function RecipeShare({ recipe, className }: RecipeShareProps) {
  const [copied, setCopied] = useState(false)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [emailForm, setEmailForm] = useState({
    to: "",
    subject: `Check out this recipe: ${recipe.title}`,
    message: `I found this amazing recipe and thought you'd love it!\n\n"${recipe.title}" by ${recipe.author}\n\n${recipe.description}`,
  })
  const { toast } = useToast()

  const recipeUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/recipe/${recipe.id}`
  const encodedUrl = encodeURIComponent(recipeUrl)
  const encodedTitle = encodeURIComponent(recipe.title)
  const encodedDescription = encodeURIComponent(recipe.description)

  const shareUrls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    instagram: `https://www.instagram.com/`, // Instagram doesn't support direct URL sharing
    tiktok: `https://www.tiktok.com/`, // TikTok doesn't support direct URL sharing
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(recipeUrl)
      setCopied(true)
      toast({
        title: "Link copied!",
        description: "Recipe link has been copied to your clipboard.",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      })
    }
  }

  const handleSocialShare = (platform: keyof typeof shareUrls) => {
    if (platform === "instagram" || platform === "tiktok") {
      // For Instagram and TikTok, copy link and show instructions
      copyToClipboard()
      toast({
        title: `Share on ${platform === "instagram" ? "Instagram" : "TikTok"}`,
        description: `Link copied! Open ${platform === "instagram" ? "Instagram" : "TikTok"} and paste the link in your story or post.`,
      })
    } else {
      window.open(shareUrls[platform], "_blank", "width=600,height=400")
    }
  }

  const handleEmailShare = () => {
    const subject = encodeURIComponent(emailForm.subject)
    const body = encodeURIComponent(`${emailForm.message}\n\n${recipeUrl}`)
    const mailtoUrl = `mailto:${emailForm.to}?subject=${subject}&body=${body}`

    window.location.href = mailtoUrl
    setEmailDialogOpen(false)
    toast({
      title: "Email client opened",
      description: "Your email client should open with the recipe details.",
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => handleSocialShare("facebook")}>
          <Facebook className="w-4 h-4 mr-2 text-blue-600" />
          Share on Facebook
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleSocialShare("instagram")}>
          <Instagram className="w-4 h-4 mr-2 text-pink-600" />
          Share on Instagram
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleSocialShare("tiktok")}>
          <div className="w-4 h-4 mr-2 bg-black rounded-sm flex items-center justify-center">
            <span className="text-white text-xs font-bold">T</span>
          </div>
          Share on TikTok
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleSocialShare("twitter")}>
          <div className="w-4 h-4 mr-2 bg-blue-400 rounded-sm flex items-center justify-center">
            <span className="text-white text-xs font-bold">X</span>
          </div>
          Share on X (Twitter)
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleSocialShare("pinterest")}>
          <div className="w-4 h-4 mr-2 bg-red-600 rounded-sm flex items-center justify-center">
            <span className="text-white text-xs font-bold">P</span>
          </div>
          Share on Pinterest
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleSocialShare("whatsapp")}>
          <div className="w-4 h-4 mr-2 bg-green-500 rounded-sm flex items-center justify-center">
            <span className="text-white text-xs font-bold">W</span>
          </div>
          Share on WhatsApp
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
          <DialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Mail className="w-4 h-4 mr-2 text-gray-600" />
              Share via Email
            </DropdownMenuItem>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Share Recipe via Email</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email-to">To</Label>
                <Input
                  id="email-to"
                  type="email"
                  placeholder="recipient@example.com"
                  value={emailForm.to}
                  onChange={(e) => setEmailForm((prev) => ({ ...prev, to: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="email-subject">Subject</Label>
                <Input
                  id="email-subject"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm((prev) => ({ ...prev, subject: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="email-message">Message</Label>
                <Textarea
                  id="email-message"
                  rows={4}
                  value={emailForm.message}
                  onChange={(e) => setEmailForm((prev) => ({ ...prev, message: e.target.value }))}
                />
              </div>
              <Button onClick={handleEmailShare} className="w-full">
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={copyToClipboard}>
          {copied ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Copy className="w-4 h-4 mr-2" />}
          {copied ? "Copied!" : "Copy Link"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
