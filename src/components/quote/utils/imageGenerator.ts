import html2canvas from "html2canvas";
import { toast } from "@/components/ui/use-toast";

export const generateImageFromHtml = async (htmlData: string): Promise<string | null> => {
  try {
    // Create an iframe to render the HTML
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.width = '1080px';
    iframe.style.height = '1080px';
    document.body.appendChild(iframe);

    // Write the HTML content to the iframe
    iframe.contentWindow?.document.open();
    iframe.contentWindow?.document.write(atob(htmlData.split(',')[1]));
    iframe.contentWindow?.document.close();

    // Wait for fonts to load
    await new Promise(resolve => setTimeout(resolve, 500));

    // Use html2canvas to capture the iframe content
    const canvas = await html2canvas(iframe.contentWindow?.document.body as HTMLElement, {
      width: 1080,
      height: 1080,
      scale: 1,
      backgroundColor: null // This ensures transparency
    });

    // Get image URL
    const url = canvas.toDataURL('image/png');

    // Clean up
    document.body.removeChild(iframe);
    
    return url;
  } catch (error) {
    console.error('Error generating image:', error);
    return null;
  }
};