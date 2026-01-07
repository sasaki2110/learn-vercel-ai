'use client';

import { useState, useRef } from 'react';

/**
 * LangGraph チャットページ
 * 
 * 案2: 直接ストリームを処理する方法
 * 
 * fetchでストリームを直接読み取り、自分で状態管理を行います。
 * メッセージIDの変更を検出して、前のメッセージをクリアし、新しいメッセージを開始します。
 * 
 * 使用している LangGraph:
 * - URL: http://localhost:2024
 * - Graph ID: p31_streaming
 */

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tools?: ToolCall[];
}

interface ToolCall {
  id: string;
  name: string;
  args: any;
  result?: string;
  status?: 'pending' | 'success' | 'error';
}

export default function LangGraphChatPage() {
  // メッセージ履歴
  const [messages, setMessages] = useState<Message[]>([]);
  // 現在のアシスタントメッセージ（ストリーミング中）
  const [currentMessage, setCurrentMessage] = useState('');
  // 現在のメッセージID（表示用）
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  // 現在のメッセージID（リアルタイム追跡用）
  const currentMessageIdRef = useRef<string | null>(null);
  // 現在のツール呼び出し（メッセージIDごとに管理）
  const [currentTools, setCurrentTools] = useState<Map<string, ToolCall[]>>(new Map());
  // 送信状態
  const [status, setStatus] = useState<'ready' | 'submitted' | 'streaming'>('ready');
  // エラー状態
  const [error, setError] = useState<Error | null>(null);
  // ストリームの中断用
  const abortControllerRef = useRef<AbortController | null>(null);

  // 入力フィールドの状態を手動で管理
  const [input, setInput] = useState('');

  // ストリームを処理する関数
  const handleStream = async (userMessage: string) => {
    // ユーザーメッセージを追加
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
    };
    setMessages(prev => [...prev, userMsg]);
    setStatus('submitted');

    // 前回のストリームを中断
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/langgraph', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            ...messages.map(msg => ({
              role: msg.role,
              content: msg.content,
            })),
            {
              role: 'user',
              content: userMessage,
            },
          ],
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      setStatus('streaming');
      setCurrentMessage('');
      setCurrentMessageId(null);
      currentMessageIdRef.current = null;
      setCurrentTools(new Map());

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalMessage = '';
      let finalMessageId: string | null = null;
      const toolsMap = new Map<string, ToolCall[]>();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              // メッセージID変更を検出
              if (data.type === 'message-id-change') {
                // 前のメッセージをクリア
                if (data.previousMessageId) {
                  setMessages(prev => prev.filter(msg => msg.id !== `assistant-${data.previousMessageId}`));
                  toolsMap.delete(data.previousMessageId);
                }
                
                // 新しいメッセージIDを設定
                currentMessageIdRef.current = data.messageId;
                setCurrentMessageId(data.messageId);
                setCurrentMessage('');
                finalMessage = '';
                finalMessageId = data.messageId;
                toolsMap.set(data.messageId, []);
                setCurrentTools(new Map(toolsMap));
              }
              
              // ツール呼び出しを処理（同じIDの場合は更新、新しい場合は追加）
              if (data.type === 'tool-call') {
                const messageId = data.messageId || currentMessageIdRef.current;
                if (messageId) {
                  const tools = toolsMap.get(messageId) || [];
                  const existingIndex = tools.findIndex(t => t.id === data.toolCall.id);
                  if (existingIndex >= 0) {
                    // 既存のツールを更新（引数が更新された場合）
                    tools[existingIndex] = {
                      ...tools[existingIndex],
                      args: data.toolCall.args,
                    };
                  } else {
                    // 新しいツールを追加
                    const newTool: ToolCall = {
                      id: data.toolCall.id,
                      name: data.toolCall.name,
                      args: data.toolCall.args,
                      status: 'pending',
                    };
                    tools.push(newTool);
                  }
                  toolsMap.set(messageId, tools);
                  setCurrentTools(new Map(toolsMap));
                }
              }
              
              // ツール結果を処理
              if (data.type === 'tool-result') {
                // すべてのメッセージIDのツールを検索して更新
                for (const [messageId, tools] of toolsMap.entries()) {
                  const toolIndex = tools.findIndex(t => t.id === data.toolCallId);
                  if (toolIndex >= 0) {
                    tools[toolIndex] = {
                      ...tools[toolIndex],
                      result: data.result,
                      status: data.status === 'success' ? 'success' : 'error',
                    };
                    toolsMap.set(messageId, tools);
                    setCurrentTools(new Map(toolsMap));
                    break;
                  }
                }
              }
              
              // コンテンツチャンクを処理
              if (data.type === 'content') {
                // メッセージIDがまだ設定されていない場合（最初のチャンク）
                if (!currentMessageIdRef.current) {
                  currentMessageIdRef.current = data.messageId;
                  setCurrentMessageId(data.messageId);
                  finalMessageId = data.messageId;
                  toolsMap.set(data.messageId, []);
                }
                
                // メッセージIDが一致する場合のみ更新
                if (data.messageId === currentMessageIdRef.current) {
                  setCurrentMessage(data.content);
                  finalMessage = data.content;
                }
              }
            } catch (parseError) {
              console.error('[ERROR] Failed to parse SSE data:', parseError, line);
            }
          }
        }
      }

      // ストリームが完了したら、現在のメッセージをメッセージ履歴に追加
      if (finalMessage && finalMessageId) {
        const tools = toolsMap.get(finalMessageId) || [];
        const assistantMsg: Message = {
          id: `assistant-${finalMessageId}`,
          role: 'assistant',
          content: finalMessage,
          tools: tools.length > 0 ? tools : undefined,
        };
        setMessages(prev => [...prev, assistantMsg]);
        setCurrentMessage('');
        setCurrentMessageId(null);
        currentMessageIdRef.current = null;
        toolsMap.delete(finalMessageId);
        setCurrentTools(new Map(toolsMap));
      }

      setStatus('ready');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }
      console.error('[ERROR] Stream error:', err);
      setError(err);
      setStatus('ready');
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">LangGraph チャット</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          LangGraph エージェントと対話します
        </p>
        <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
          API: http://localhost:2024 | エージェントIDは.env.localのLANGGRAPH_AGENT_IDで設定
        </p>
      </div>
      
      {/* メッセージ表示エリア */}
      <div className="space-y-4 mb-6 min-h-[400px] max-h-[600px] overflow-y-auto">
        {messages.length === 0 && !currentMessage && (
          <div className="text-center text-gray-500 mt-20">
            <p>メッセージを入力して LangGraph エージェントと会話を始めましょう</p>
            <p className="text-xs mt-2 text-gray-400">
              このエージェントは、トピック抽出 → トピック精緻化 → ジョーク生成の処理を行います
            </p>
          </div>
        )}
        {messages.map((message) => {
          return (
            <div
              key={message.id}
              className={`p-4 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-100 dark:bg-blue-900 ml-auto max-w-[80%]'
                  : 'bg-gray-100 dark:bg-gray-800 mr-auto max-w-[80%]'
              }`}
            >
              <div className="font-semibold mb-1 text-sm">
                {message.role === 'user' ? 'あなた' : 'LangGraph エージェント'}
              </div>
              <div className="whitespace-pre-wrap">
                {message.content}
              </div>
              {/* ツール呼び出しの表示 */}
              {message.tools && message.tools.length > 0 && (
                <div className="mt-2 space-y-2">
                  {message.tools.map((tool, index) => (
                    <div key={tool.id || index} className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded text-sm">
                      <div className="font-semibold">
                        🔧 ツール呼び出し: {tool.name}
                        {tool.status === 'pending' && <span className="ml-2 text-xs">(実行中...)</span>}
                        {tool.status === 'success' && <span className="ml-2 text-xs">(完了)</span>}
                        {tool.status === 'error' && <span className="ml-2 text-xs text-red-600">(エラー)</span>}
                      </div>
                      
                      {/* 入力パラメータの表示 */}
                      {tool.args && (
                        <div className="text-gray-600 dark:text-gray-300 mt-1">
                          <div className="text-xs font-semibold">パラメータ:</div>
                          <div className="text-xs font-mono bg-white dark:bg-gray-800 p-1 rounded mt-1">
                            {JSON.stringify(tool.args, null, 2)}
                          </div>
                        </div>
                      )}
                      
                      {/* 出力結果の表示 */}
                      {tool.result !== undefined && (
                        <div className="text-gray-600 dark:text-gray-300 mt-2">
                          <div className="text-xs font-semibold">✅ 結果:</div>
                          <div className="text-xs font-mono bg-green-50 dark:bg-green-950 p-1 rounded mt-1 whitespace-pre-wrap">
                            {tool.result}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {(status === 'submitted' || status === 'streaming') && currentMessage && (
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mr-auto max-w-[80%]">
            <div className="font-semibold mb-1 text-sm">LangGraph エージェント</div>
            <div className="whitespace-pre-wrap">
              {currentMessage}
            </div>
            {/* ストリーミング中のツール呼び出しの表示 */}
            {currentMessageId && currentTools.has(currentMessageId) && currentTools.get(currentMessageId)!.length > 0 && (
              <div className="mt-2 space-y-2">
                {currentTools.get(currentMessageId)!.map((tool, index) => (
                  <div key={tool.id || index} className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded text-sm">
                    <div className="font-semibold">
                      🔧 ツール呼び出し: {tool.name}
                      {tool.status === 'pending' && <span className="ml-2 text-xs">(実行中...)</span>}
                      {tool.status === 'success' && <span className="ml-2 text-xs">(完了)</span>}
                      {tool.status === 'error' && <span className="ml-2 text-xs text-red-600">(エラー)</span>}
                    </div>
                    
                    {/* 入力パラメータの表示 */}
                    {tool.args && (
                      <div className="text-gray-600 dark:text-gray-300 mt-1">
                        <div className="text-xs font-semibold">パラメータ:</div>
                        <div className="text-xs font-mono bg-white dark:bg-gray-800 p-1 rounded mt-1">
                          {JSON.stringify(tool.args, null, 2)}
                        </div>
                      </div>
                    )}
                    
                    {/* 出力結果の表示 */}
                    {tool.result !== undefined && (
                      <div className="text-gray-600 dark:text-gray-300 mt-2">
                        <div className="text-xs font-semibold">✅ 結果:</div>
                        <div className="text-xs font-mono bg-green-50 dark:bg-green-950 p-1 rounded mt-1 whitespace-pre-wrap">
                          {tool.result}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {(status === 'submitted' || status === 'streaming') && !currentMessage && (
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mr-auto max-w-[80%]">
            <div className="font-semibold mb-1 text-sm">LangGraph エージェント</div>
            <div className="text-gray-500">処理中...</div>
          </div>
        )}
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 rounded">
          <h2 className="font-bold mb-2 text-red-800 dark:text-red-200">エラー:</h2>
          <pre className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">
            {error.message || 'エラーが発生しました。もう一度お試しください。'}
          </pre>
          <p className="text-xs mt-2 text-red-600 dark:text-red-400">
            LangGraph サーバー（http://localhost:2024）が起動しているか確認してください。
          </p>
        </div>
      )}

      {/* 入力フォーム */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim() && status === 'ready') {
            handleStream(input);
            setInput('');
          }
        }}
        className="space-y-4"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="メッセージを入力（例: プログラミングについて教えて）..."
            className="flex-1 p-3 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={status !== 'ready'}
          />
          <button
            type="submit"
            disabled={status !== 'ready' || !input.trim()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
          >
            {status === 'submitted' || status === 'streaming' ? '送信中...' : '送信'}
          </button>
          {status === 'streaming' && (
            <button
              type="button"
              onClick={() => {
                if (abortControllerRef.current) {
                  abortControllerRef.current.abort();
                }
                setStatus('ready');
                setCurrentMessage('');
                setCurrentMessageId(null);
                currentMessageIdRef.current = null;
              }}
              className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              中断
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

