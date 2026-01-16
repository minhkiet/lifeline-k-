import React, { useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";

const ApiTest: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [baseURL, setBaseURL] = useState<string>('');
  const [modelId, setModelId] = useState<string>('');

  // Load env vars
  React.useEffect(() => {
    const key = import.meta.env.VITE_GEMINI_API_KEY || '';
    const url = import.meta.env.VITE_BASE_URL || '';
    const model = import.meta.env.VITE_MODEL_NAME || 'gemini-2.0-flash-thinking-exp-01-21';
    
    setApiKey(key);
    setBaseURL(url);
    setModelId(model);
    
    // Log to console for debugging
    console.log('Environment Variables:', {
      VITE_GEMINI_API_KEY: key ? `${key.substring(0, 10)}...` : 'NOT SET',
      VITE_BASE_URL: url || 'NOT SET (using native Gemini)',
      VITE_MODEL_NAME: model,
      useNativeGemini: !url
    });
  }, []);

  const testConnection = async () => {
    setStatus('testing');
    setMessage('Đang kiểm tra kết nối...');

    try {
      if (!apiKey) {
        throw new Error('API Key chưa được cấu hình trong .env');
      }

      const useNativeGemini = !baseURL;
      
      if (useNativeGemini) {
        // Test native Gemini API
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelId });
        
        const result = await model.generateContent("Say 'Hello' in one word");
        const response = result.response;
        const text = response.text();
        
        setStatus('success');
        setMessage(`✅ Kết nối thành công! API đã phản hồi: "${text}"`);
      } else {
        // Test with OpenAI-compatible endpoint
        const response = await fetch(`${baseURL}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: modelId,
            messages: [{ role: 'user', content: 'Say Hello in one word' }],
            max_tokens: 10
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`HTTP ${response.status}: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || 'No response';
        
        setStatus('success');
        setMessage(`✅ Kết nối thành công qua proxy! API đã phản hồi: "${content}"`);
      }
    } catch (error: any) {
      setStatus('error');
      const errorMsg = error.message || error.toString();
      
      if (errorMsg.includes('quota') || errorMsg.includes('429') || errorMsg.includes('rate limit')) {
        setMessage(`⚠️ API Key hợp lệ nhưng đã hết quota hoặc bị rate limit: ${errorMsg}`);
      } else if (errorMsg.includes('401') || errorMsg.includes('unauthorized') || errorMsg.includes('invalid')) {
        setMessage(`❌ API Key không hợp lệ: ${errorMsg}`);
      } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
        setMessage(`❌ Lỗi kết nối mạng: ${errorMsg}`);
      } else {
        setMessage(`❌ Lỗi: ${errorMsg}`);
      }
      
      console.error('API Test Error:', error);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 max-w-2xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        Kiểm tra kết nối Gemini API
      </h2>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            API Key:
          </label>
          <div className="p-2 bg-gray-50 dark:bg-slate-900 rounded border border-gray-200 dark:border-slate-600 text-sm font-mono">
            {apiKey ? `${apiKey.substring(0, 15)}...${apiKey.substring(apiKey.length - 5)}` : '❌ CHƯA ĐƯỢC CẤU HÌNH'}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Base URL:
          </label>
          <div className="p-2 bg-gray-50 dark:bg-slate-900 rounded border border-gray-200 dark:border-slate-600 text-sm">
            {baseURL || 'Không có (sử dụng Gemini API gốc)'}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Model ID:
          </label>
          <div className="p-2 bg-gray-50 dark:bg-slate-900 rounded border border-gray-200 dark:border-slate-600 text-sm">
            {modelId}
          </div>
        </div>
      </div>

      <button
        onClick={testConnection}
        disabled={status === 'testing' || !apiKey}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
      >
        {status === 'testing' ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}
      </button>

      {message && (
        <div className={`mt-4 p-4 rounded-lg ${
          status === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' :
          status === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300' :
          'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
        }`}>
          <p className="text-sm whitespace-pre-wrap">{message}</p>
        </div>
      )}

      <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <p className="text-xs text-yellow-800 dark:text-yellow-300">
          <strong>Lưu ý:</strong> Đảm bảo file .env có biến VITE_GEMINI_API_KEY. 
          Sau khi thay đổi .env, cần khởi động lại dev server.
        </p>
      </div>
    </div>
  );
};

export default ApiTest;
