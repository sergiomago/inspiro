import { toast } from "@/components/ui/use-toast";

interface ShareOptions {
  imageUrl: string;
  quote: string;
  author: string;
}

export const shareToSocial = async (platform: string, { imageUrl, quote, author }: ShareOptions) => {
  const text = `"${quote}" - ${author}\n\nShared via Inspiro`;
  let url = '';

  switch (platform) {
    case 'facebook':
      url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(imageUrl)}&quote=${encodeURIComponent(text)}`;
      break;
    case 'twitter':
      url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(imageUrl)}`;
      break;
    case 'linkedin':
      url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(imageUrl)}&summary=${encodeURIComponent(text)}`;
      break;
    case 'instagram':
      toast({
        title: "Share on Instagram",
        description: "Click the download button and share the image on Instagram",
      });
      return;
    default:
      return;
  }

  window.open(url, '_blank');
};

export const downloadImage = async (imageUrl: string) => {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `inspiro-quote-${Date.now()}.png`;
    link.href = url;
    link.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Image downloaded!",
      description: "Your quote card has been saved",
    });
  } catch (error) {
    toast({
      title: "Error downloading image",
      description: "Please try again",
      variant: "destructive"
    });
  }
};

export const copyImageLink = async (imageUrl: string) => {
  try {
    await navigator.clipboard.writeText(imageUrl);
    toast({
      title: "Link copied!",
      description: "The image link has been copied to your clipboard",
    });
  } catch (error) {
    toast({
      title: "Error copying link",
      description: "Please try again",
      variant: "destructive"
    });
  }
};