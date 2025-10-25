import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CLASS_NAME = "SeymenTest";

// Chunk text into smaller pieces with overlap
function chunkText(text: string, chunkSize: number = 220, overlap: number = 40): string[] {
  const chunks: string[] = [];
  const words = text.split(/\s+/);
  
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    chunks.push(chunk);
  }
  
  return chunks;
}

// Extract text from PDF using Claude
async function extractTextFromPDF(base64Data: string, anthropicApiKey: string): Promise<string> {
  console.log('Extracting text from PDF using Claude...');
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': anthropicApiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: 'Extract all text from this PDF document. Return only the extracted text content, preserving the structure and formatting as much as possible.',
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Claude API error:', errorText);
    throw new Error(`Failed to extract text from PDF: ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.content || !data.content[0] || !data.content[0].text) {
    console.error('Unexpected Claude response:', JSON.stringify(data));
    throw new Error('Invalid response from Claude API');
  }
  
  return data.content[0].text;
}

// Extract text from image using Claude vision
async function extractTextFromImage(base64Data: string, mimeType: string, anthropicApiKey: string): Promise<string> {
  console.log('Extracting text from image using Claude...');
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': anthropicApiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: 'Extract all text from this image using OCR. If there is no text, describe what you see in the image.',
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Claude API error:', errorText);
    throw new Error(`Failed to extract text from image: ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.content || !data.content[0] || !data.content[0].text) {
    console.error('Unexpected Claude response:', JSON.stringify(data));
    throw new Error('Invalid response from Claude API');
  }
  
  return data.content[0].text;
}

// Extract text from DOCX or other office files
async function extractTextFromDocument(base64Data: string, fileName: string, openaiApiKey: string): Promise<string> {
  console.log(`Extracting text from ${fileName}...`);
  
  // For DOCX, PPTX, XLSX, etc., we'll use a simple approach
  // In production, consider using dedicated parsing libraries
  
  // Decode base64
  const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
  const text = new TextDecoder().decode(binaryData);
  
  // Simple text extraction (works for some formats)
  const extractedText = text.replace(/[^\x20-\x7E\n]/g, ' ').trim();
  
  if (extractedText.length > 100) {
    return extractedText;
  }
  
  // If simple extraction fails, return a placeholder
  return `Document: ${fileName} (Text extraction not fully supported for this format)`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const weaviateUrl = Deno.env.get('WEAVIATE_URL');
    const weaviateApiKey = Deno.env.get('WEAVIATE_API_KEY');
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!weaviateUrl || !weaviateApiKey || !anthropicApiKey || !openaiApiKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    // Get user ID from auth header
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
      
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      userId = user?.id;
    }

    // Parse request body
    const { fileIds } = await req.json();

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      throw new Error('No file IDs provided');
    }

    console.log(`Processing ${fileIds.length} binary files...`);

    // Prepare Weaviate URL
    let formattedUrl = weaviateUrl;
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const processedFiles = [];

    for (const fileId of fileIds) {
      // Get file metadata from database
      const { data: fileData, error: fileError } = await supabase
        .from('uploaded_files')
        .select('*')
        .eq('id', fileId)
        .single();

      if (fileError || !fileData) {
        console.error(`File not found: ${fileId}`);
        continue;
      }

      console.log(`Processing file: ${fileData.file_name}`);

      // Download file from storage
      const { data: fileBlob, error: downloadError } = await supabase.storage
        .from('uploaded-files')
        .download(fileData.storage_path);

      if (downloadError || !fileBlob) {
        console.error(`Failed to download file: ${fileData.file_name}`);
        continue;
      }

      // Convert blob to base64
      const arrayBuffer = await fileBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const base64 = btoa(String.fromCharCode(...uint8Array));

      let extractedText = '';
      const fileType = fileData.file_type.toLowerCase();

      // Extract text based on file type
      if (fileType.includes('pdf')) {
        extractedText = await extractTextFromPDF(base64, anthropicApiKey);
      } else if (fileType.includes('image')) {
        extractedText = await extractTextFromImage(base64, fileData.file_type, anthropicApiKey);
      } else if (
        fileType.includes('word') || 
        fileType.includes('document') || 
        fileType.includes('presentation') || 
        fileType.includes('spreadsheet')
      ) {
        extractedText = await extractTextFromDocument(base64, fileData.file_name, anthropicApiKey);
      } else {
        console.warn(`Unsupported file type: ${fileData.file_type}`);
        continue;
      }

      if (!extractedText || extractedText.trim().length === 0) {
        console.warn(`No text extracted from: ${fileData.file_name}`);
        continue;
      }

      console.log(`Extracted ${extractedText.length} characters from ${fileData.file_name}`);

      // Chunk the extracted text
      const chunks = chunkText(extractedText);
      console.log(`Split into ${chunks.length} chunks`);

      // Upload chunks to Weaviate
      const batchSize = 100;
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        
        const objects = batch.map((chunk, idx) => ({
          class: CLASS_NAME,
          properties: {
            content: chunk,
            title: fileData.file_name,
            document_name: fileData.file_name,
            chunk_index: i + idx,
          },
        }));

        const batchResponse = await fetch(`${formattedUrl}/v1/batch/objects`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${weaviateApiKey}`,
            'Content-Type': 'application/json',
            'X-OpenAI-Api-Key': openaiApiKey,
          },
          body: JSON.stringify({ objects }),
        });

        if (!batchResponse.ok) {
          const errorText = await batchResponse.text();
          console.error(`Batch insert failed: ${errorText}`);
          throw new Error(`Failed to insert batch: ${errorText}`);
        }
      }

      // Update file metadata
      await supabase
        .from('uploaded_files')
        .update({ rag_processed: true })
        .eq('id', fileId);

      processedFiles.push({
        id: fileId,
        name: fileData.file_name,
        chunks: chunks.length,
        extractedLength: extractedText.length,
      });

      console.log(`Successfully processed ${fileData.file_name}`);
    }

    return new Response(
      JSON.stringify({
        message: 'Binary files processed successfully',
        files: processedFiles,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Processing error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Processing failed',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
