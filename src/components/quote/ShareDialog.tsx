import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Share2, Link, Facebook, Twitter, Linkedin, Instagram } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface ShareDialogProps {
  quote: string
  author: string
}

export const ShareDialog = ({ quote, author }: ShareDialogProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const { toast } = useToast()

  const generateImage = async () => {
    if (imageUrl) return // Don't regenerate if we already have an image

    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('generate-quote-image', {
        body: { quote, author }
      })

      if (error) throw error
      setImageUrl(data.imageUrl)
    } catch (error) {
      toast({
        title: "Error generating image",
        description: "Please try again later",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const shareToSocial = async (platform: string) => {
    if (!imageUrl) return

    const text = `"${quote}" - ${author}\n\nShared via Inspiro`
    let url = ''

    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(imageUrl)}`
        break
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(imageUrl)}`
        break
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(imageUrl)}`
        break
      case 'instagram':
        toast({
          title: "Instagram Sharing",
          description: "Please download the image and share it manually on Instagram",
        })
        return
      default:
        return
    }

    window.open(url, '_blank')
  }

  const copyLink = async () => {
    if (!imageUrl) return
    
    try {
      await navigator.clipboard.writeText(imageUrl)
      toast({
        title: "Link copied!",
        description: "The image link has been copied to your clipboard",
      })
    } catch (error) {
      toast({
        title: "Error copying link",
        description: "Please try again",
        variant: "destructive"
      })
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="text-white/80 hover:text-white hover:bg-white/10"
          onClick={generateImage}
        >
          <Share2 className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Quote</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {imageUrl && (
            <img 
              src={imageUrl} 
              alt="Quote card" 
              className="w-full rounded-lg shadow-lg"
            />
          )}
          {isLoading && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant="outline" size="icon" onClick={copyLink}>
              <Link className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => shareToSocial('facebook')}>
              <Facebook className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => shareToSocial('twitter')}>
              <Twitter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => shareToSocial('linkedin')}>
              <Linkedin className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => shareToSocial('instagram')}>
              <Instagram className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}