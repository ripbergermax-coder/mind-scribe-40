const N8N_WEBHOOK_URL = 'https://customm.app.n8n.cloud/webhook/b787719b-fce6-4896-94d7-51bb862af30f';

/**
 * Sends data (text, audio, documents) to N8N webhook
 */
export async function sendToN8N(payload) {
  try {
    const formData = new FormData();
    
    // Add text prompt
    formData.append('textPrompt', payload.textPrompt);
    
    // Add audio file (if available)
    if (payload.audioFile) {
      formData.append('audioFile', payload.audioFile);
    }
    
    // Add document (if available)
    if (payload.document) {
      formData.append('document', payload.document);
    }
    
    // Add metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      uploadId: `upload_${Date.now()}`,
      userAgent: navigator.userAgent,
      ...payload.metadata
    };
    formData.append('metadata', JSON.stringify(metadata));

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      message: 'Data successfully sent to N8N',
      data
    };

  } catch (error) {
    console.error('Error sending data to N8N:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: `N8N Error: ${errorMessage}`
    };
  }
}

/**
 * Sends only text (without files)
 */
export async function sendTextToN8N(textPrompt, metadata) {
  return sendToN8N({ textPrompt, metadata });
}

/**
 * Sends data as JSON (for smaller files as Base64)
 */
export async function sendToN8NAsJSON(payload) {
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        textPrompt: payload.textPrompt,
        textType: "text",
        audioBase64: payload.audioBase64,
        documentBase64: payload.documentBase64,
        metadata: {
          timestamp: new Date().toISOString(),
          uploadId: `upload_${Date.now()}`,
          ...payload.metadata
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      message: 'Data successfully sent to N8N',
      data
    };

  } catch (error) {
    console.error('Error sending data to N8N:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: `N8N Error: ${errorMessage}`
    };
  }
}

/**
 * Helper function: Converts File to Base64
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}
