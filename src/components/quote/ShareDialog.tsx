import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Share2, Link, Facebook, Twitter, Linkedin, Instagram, Download } from "lucide-react"
import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { generateImageFromHtml } from "./utils/imageGenerator"
import { shareToSocial, downloadImage, copyImageLink } from "./utils/socialSharing"

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
    const generateUrl = async () => {
      if (htmlData) {
        const url = await generateImageFromHtml(htmlData)
        if (url) setImageUrl(url)
      }
    }
    generateUrl()
  }, [htmlData])

  // Reset image when quote changes
  useEffect(() => {
    setHtmlData(null)
    setImageUrl(null)
  }, [quote, author])

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
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => imageUrl && copyImageLink(imageUrl)}
              disabled={!imageUrl}
            >
              <Link className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => imageUrl && shareToSocial('facebook', { imageUrl, quote, author })}
              disabled={!imageUrl}
            >
              <Facebook className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => imageUrl && shareToSocial('twitter', { imageUrl, quote, author })}
              disabled={!imageUrl}
            >
              <Twitter className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => imageUrl && shareToSocial('linkedin', { imageUrl, quote, author })}
              disabled={!imageUrl}
            >
              <Linkedin className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => imageUrl && shareToSocial('instagram', { imageUrl, quote, author })}
              disabled={!imageUrl}
            >
              <Instagram className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => imageUrl && downloadImage(imageUrl)}
              disabled={!imageUrl}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}