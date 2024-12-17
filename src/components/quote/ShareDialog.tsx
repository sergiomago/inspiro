import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Share2, Link, Facebook, Twitter, Linkedin, Instagram, Download } from "lucide-react"
import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import html2canvas from "html2canvas"

interface ShareDialogProps {
  quote: string
  author: string
}

export const ShareDialog = ({ quote, author }: ShareDialogProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [htmlData, setHtmlData] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const { toast } = useToast()

  const generateImage = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('generate-quote-image', {
        body: { quote, author }
      })

      if (error) throw error
      
      // Only update if the quote matches (prevents stale data)
      if (data.quote === quote && data.author === author) {
        setHtmlData(data.imageData)
      }
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

  // Generate image URL when HTML data changes
  useEffect(() => {
    if (htmlData) {
      generateImageUrl()
    }
  }, [htmlData])

  // Reset image when quote changes
  useEffect(() => {
    setHtmlData(null)
    setImageUrl(null)
  }, [quote, author])

  const generateImageUrl = async () => {
    if (!htmlData) return

    try {
      // Create an iframe to render the HTML
      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.top = '-9999px'
      iframe.style.width = '1080px'
      iframe.style.height = '1080px'
      document.body.appendChild(iframe)

      // Write the HTML content to the iframe
      iframe.contentWindow?.document.open()
      iframe.contentWindow?.document.write(atob(htmlData.split(',')[1]))
      iframe.contentWindow?.document.close()

      // Wait for fonts to load
      await new Promise(resolve => setTimeout(resolve, 500))

      // Use html2canvas to capture the iframe content
      const canvas = await html2canvas(iframe.contentWindow?.document.body as HTMLElement, {
        width: 1080,
        height: 1080,
        scale: 1
      })

      // Get image URL
      const url = canvas.toDataURL('image/png')
      setImageUrl(url)

      // Clean up
      document.body.removeChild(iframe)
    } catch (error) {
      toast({
        title: "Error generating image URL",
        description: "Please try again",
        variant: "destructive"
      })
    }
  }

  const handleDownload = async () => {
    if (!imageUrl) return

    try {
      const link = document.createElement('a')
      link.download = `inspiro-quote-${Date.now()}.png`
      link.href = imageUrl
      link.click()

      toast({
        title: "Image downloaded!",
        description: "Your quote card has been saved",
      })
    } catch (error) {
      toast({
        title: "Error downloading image",
        description: "Please try again",
        variant: "destructive"
      })
    }
  }

  const shareToSocial = async (platform: string) => {
    if (!imageUrl) return

    const text = `"${quote}" - ${author}\n\nShared via Inspiro`
    let url = ''

    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(imageUrl)}&quote=${encodeURIComponent(text)}`
        break
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(imageUrl)}`
        break
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(imageUrl)}&summary=${encodeURIComponent(text)}`
        break
      case 'instagram':
        toast({
          title: "Share on Instagram",
          description: "Click the download button and share the image on Instagram",
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
          {htmlData && (
            <iframe 
              srcDoc={atob(htmlData.split(',')[1])}
              className="w-full aspect-square rounded-lg shadow-lg"
              title="Quote card preview"
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
            <Button variant="outline" size="icon" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}