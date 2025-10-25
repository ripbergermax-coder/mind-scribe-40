import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CLASS_NAME = "TactoCollection";

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const weaviateUrl = Deno.env.get('WEAVIATE_URL');
    const weaviateApiKey = Deno.env.get('WEAVIATE_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!weaviateUrl || !weaviateApiKey || !openaiApiKey) {
      throw new Error('Missing required environment variables');
    }

    console.log('Connecting to Weaviate...');

    // Prepare Weaviate URL
    let formattedUrl = weaviateUrl;
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Formatted Weaviate URL:', formattedUrl);

    // Check if schema exists
    const schemaCheckResponse = await fetch(`${formattedUrl}/v1/schema/${CLASS_NAME}`, {
      headers: {
        'Authorization': `Bearer ${weaviateApiKey}`,
      },
    });

    if (schemaCheckResponse.status === 404) {
      console.log(`Creating class: ${CLASS_NAME}`);
      
      const createSchemaResponse = await fetch(`${formattedUrl}/v1/schema`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${weaviateApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          class: CLASS_NAME,
          description: 'Chunks of documents for RAG',
          vectorizer: 'text2vec-openai',
          moduleConfig: {
            'text2vec-openai': {
              model: 'text-embedding-3-large',
              modelVersion: 'ada-003',
              type: 'text',
            },
          },
          properties: [
            {
              name: 'content',
              dataType: ['text'],
              description: 'Chunk text',
            },
            {
              name: 'document_name',
              dataType: ['text'],
              description: 'Source filename',
            },
            {
              name: 'chunk_index',
              dataType: ['int'],
              description: 'Chunk index',
            },
            {
              name: 'title',
              dataType: ['text'],
              description: 'Original title',
            },
          ],
        }),
      });

      if (!createSchemaResponse.ok) {
        const errorText = await createSchemaResponse.text();
        throw new Error(`Failed to create schema: ${errorText}`);
      }

      console.log('Schema created successfully');
    } else if (!schemaCheckResponse.ok) {
      const errorText = await schemaCheckResponse.text();
      throw new Error(`Failed to check schema: ${errorText}`);
    } else {
      console.log(`Class ${CLASS_NAME} already exists`);
    }

    // Parse request body
    const { files } = await req.json();

    if (!files || !Array.isArray(files) || files.length === 0) {
      throw new Error('No files provided');
    }

    console.log(`Processing ${files.length} files...`);

    const uploadedFiles = [];

    for (const file of files) {
      const { name, content } = file;
      
      if (!name || !content) {
        console.warn('Skipping invalid file:', name);
        continue;
      }

      console.log(`Processing file: ${name}`);

      const chunksForInsert: Array<{ content: string; title: string }> = [];

      // Handle JSON files
      if (name.toLowerCase().endsWith('.json')) {
        try {
          const items = JSON.parse(content);
          console.log(`JSON file with ${items.length} items`);

          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const text = item.content || '';
            const title = item.title || item.name || '';

            const chunks = chunkText(text);
            chunks.forEach((chunk, j) => {
              chunksForInsert.push({
                content: chunk,
                title: j === 0 ? title : `${title} (Part ${j + 1})`,
              });
            });
          }
        } catch (e) {
          console.error(`JSON parse error for ${name}:`, e);
          throw new Error(`JSON parse failed for ${name}`);
        }
      } else {
        // Handle text files
        const chunks = chunkText(content);
        console.log(`Text file split into ${chunks.length} chunks`);

        chunks.forEach((chunk) => {
          chunksForInsert.push({
            content: chunk,
            title: name,
          });
        });
      }

      console.log(`Inserting ${chunksForInsert.length} chunks for ${name}`);

      // Insert chunks in batches of 100
      const batchSize = 100;
      for (let i = 0; i < chunksForInsert.length; i += batchSize) {
        const batch = chunksForInsert.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunksForInsert.length / batchSize)}`);

        const objects = batch.map((chunk, idx) => ({
          class: CLASS_NAME,
          properties: {
            content: chunk.content,
            title: chunk.title,
            document_name: name,
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

        const batchResult = await batchResponse.json();
        console.log(`Batch ${Math.floor(i / batchSize) + 1} completed:`, batchResult.length, 'objects');
      }

      uploadedFiles.push({
        name,
        chunks: chunksForInsert.length,
      });

      console.log(`Successfully uploaded ${name}`);
    }

    return new Response(
      JSON.stringify({
        message: 'Files uploaded successfully',
        files: uploadedFiles,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Upload failed',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
