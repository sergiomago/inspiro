import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import OpenAI from "https://esm.sh/openai@4.28.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    })

    if (!Deno.env.get('OPENAI_API_KEY')) {
      throw new Error('OPENAI_API_KEY is not set')
    }

    const { quote, author } = await req.json()

    if (!quote || !author) {
      throw new Error('Quote and author are required')
    }

    console.log('Generating image for quote:', quote, 'by', author)

    const prompt = `Create a beautiful quote card image with this quote: "${quote}" by ${author}. 
    The image should have an elegant, minimal design with a subtle gradient background. 
    The quote should be centered and use an elegant serif font. 
    Include the author name below the quote in a smaller font. 
    Add the "inspiro" logo in a subtle way at the bottom. 
    The image should be in a 1:1 square format optimal for social media sharing.`

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      response_format: "url",
    })

    console.log('Image generated successfully')

    return new Response(
      JSON.stringify({ imageUrl: response.data[0].url }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error in generate-quote-image function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to generate quote image'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})