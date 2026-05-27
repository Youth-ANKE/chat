import { useState, useRef, useEffect, forwardRef, useImperativeHandle, useCallback, type KeyboardEvent, type DragEvent, type ClipboardEvent } from 'react';
import { Send, Square, Paperclip, Globe, X, Image, FileText, BookOpen, UploadCloud, Reply, ScanEye, FileSearch } from 'lucide-react';
import type { ModelName, ChatMessage } from '../types';
import { DEFAULT_DEEPSEEK_MODEL } from '../types';
import { useSettingsStore } from '../stores/settingsStore';
import { useProviderStore } from '../stores/providerStore';
import { getModelById } from '../lib/provider-adapter';
import { playClick, playDelete } from '../lib/sound';
import { cn } from '../lib/utils';
import { VoiceInputButton } from './VoiceInputButton';
import { parseDocument, isParseableDocument } from '../lib/document-parser';
import { extractTextFromImage } from '../lib/ocr';
import { useTranslation } from 'react-i18next';

export interface ComposerHandle {
  /** Insert text at cursor position (or append), updating React state */
  insertText: (text: string) => void;
  /** The underlying textarea element */
  textarea: HTMLTextAreaElement | null;
}

interface ComposerProps {
  onSend: (
    content: string,
    attachments?: { type: 'image' | 'text'; mimeType: string; data: string; name: string }[]
  ) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  model?: ModelName;
  webSearch?: boolean;
  onToggleWebSearch?: () => void;
  onOpenPromptLibrary?: () => void;
  /** Quoted reply message (when replying to a message) */
  replyTo?: { message: ChatMessage; onClear: () => void };
}

interface PendingFile {
  id: string;
  name: string;
  type: 'image' | 'text';
  mimeType: string;
  data: string;
  size: number;
}

function getModelLabel(modelId: string): string {
  const providers = useProviderStore.getState().providers;
  const info = getModelById(modelId, providers);
  return info?.model.name ?? modelId;
}

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const TEXT_TYPES = [
  'text/plain', 'text/markdown', 'text/csv', 'text/xml',
  'application/json', 'application/javascript', 'application/typescript',
  'text/x-python', 'text/x-java', 'text/x-c', 'text/x-c++',
  'text/x-go', 'text/x-rust', 'application/x-yaml', 'text/html',
  'text/css', 'application/xml',
];

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 2.5);
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const Composer = forwardRef<ComposerHandle, ComposerProps>(
  function Composer({ onSend, onStop, isStreaming, disabled, model, webSearch, onToggleWebSearch, onOpenPromptLibrary, replyTo }, ref) {
    const { t } = useTranslation();
    const [input, setInput] = useState('');
    const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
    const [ocrPending, setOcrPending] = useState(false);
    const [docParsing, setDocParsing] = useState(false);
    const innerRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const darkMode = useSettingsStore((s) => s.settings.darkMode);
    const voiceAutoSend = useSettingsStore((s) => s.settings.voiceAutoSend);
    const charCount = input.length;
    const tokenEstimate = estimateTokens(input);

    // Expose imperative handle
    useImperativeHandle(ref, () => ({
      textarea: innerRef.current,
      insertText: (text: string) => {
        const el = innerRef.current;
        if (!el) return;
        const current = el.value;
        if (!current.trim()) {
          setInput(text);
        } else {
          const cursor = el.selectionStart ?? current.length;
          const before = current.slice(0, cursor);
          const after = current.slice(cursor);
          const newValue = `${before}\n\n${text}${after}`;
          setInput(newValue);
          // Restore cursor position after React re-render
          requestAnimationFrame(() => {
            el.focus();
            el.selectionStart = el.selectionEnd = (before + '\n\n' + text).length;
          });
        }
      },
    }), []);

    // Auto-resize
    useEffect(() => {
      const el = innerRef.current;
      if (!el) return;
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 200) + 'px';
    }, [input]);

    // Focus on mount
    useEffect(() => { innerRef.current?.focus(); }, []);

    const processFile = async (file: File) => {
      // Try document parsing for office formats
      if (isParseableDocument(file)) {
        setDocParsing(true);
        try {
          const result = await parseDocument(file);
          if (result?.text) {
            setPendingFiles((prev) => [
              ...prev,
              {
                id: `f-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                name: file.name,
                type: 'text',
                mimeType: 'text/plain',
                data: result.text,
                size: result.text.length,
              },
            ]);
          }
        } catch { /* fallback */ }
        setDocParsing(false);
        return;
      }

      const reader = new FileReader();
      if (IMAGE_TYPES.includes(file.type)) {
        reader.onload = async () => {
          if (typeof reader.result === 'string') {
            const dataUri = reader.result as string;
            setPendingFiles((prev) => [
              ...prev,
              {
                id: `f-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                name: file.name,
                type: 'image',
                mimeType: file.type,
                data: dataUri,
                size: file.size,
              },
            ]);
            // Try OCR on the image
            setOcrPending(true);
            try {
              const providers = useProviderStore.getState().providers;
              const info = getModelById(model ?? DEFAULT_DEEPSEEK_MODEL, providers);
              const result = await extractTextFromImage(
                dataUri,
                model ?? DEFAULT_DEEPSEEK_MODEL,
                info?.provider.baseUrl,
                info?.provider.apiKey,
                info?.provider.authType ?? 'bearer',
              );
              if (result.hasText) {
                setPendingFiles((prev) => [
                  ...prev,
                  {
                    id: `ocr-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                    name: `OCR: ${file.name}`,
                    type: 'text',
                    mimeType: 'text/plain',
                    data: `[图片文字识别: ${file.name}]\n${result.text}`,
                    size: result.text.length,
                  },
                ]);
              }
            } catch { /* OCR failed, silent */ }
            setOcrPending(false);
          }
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setPendingFiles((prev) => [
              ...prev,
              {
                id: `f-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                name: file.name,
                type: 'text',
                mimeType: file.type,
                data: reader.result as string,
                size: file.size,
              },
            ]);
          }
        };
        reader.readAsText(file);
      }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length === 0) return;
      for (const file of files) {
        await processFile(file);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeFile = (id: string) => {
      playDelete();
      setPendingFiles((prev) => prev.filter((f) => f.id !== id));
    };

    const handleSend = () => {
      const trimmed = input.trim();
      const hasFiles = pendingFiles.length > 0;
      if ((!trimmed && !hasFiles) || isStreaming || disabled) return;
      onSend(
        trimmed,
        hasFiles
          ? pendingFiles.map((f) => ({
              type: f.type,
              mimeType: f.mimeType,
              data: f.data,
              name: f.name,
            }))
          : undefined
      );
      setInput('');
      setPendingFiles([]);
      if (innerRef.current) innerRef.current.style.height = 'auto';
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const totalSize = pendingFiles.reduce((s, f) => s + f.size, 0);

    // ── Drag & Drop ──
    const [dragOver, setDragOver] = useState(false);
    const dragCounter = useRef(0);

    const handleDragEnter = useCallback((e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current += 1;
      if (e.dataTransfer.items?.length > 0) setDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current -= 1;
      if (dragCounter.current <= 0) {
        dragCounter.current = 0;
        setDragOver(false);
      }
    }, []);

    const processDroppedFiles = useCallback(
      async (files: FileList) => {
        for (const file of Array.from(files)) {
          await processFile(file);
        }
      },
      [model]
    );

    const handleDrop = useCallback(
      (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        dragCounter.current = 0;
        if (e.dataTransfer.files?.length) {
          processDroppedFiles(e.dataTransfer.files);
        }
      },
      [processDroppedFiles]
    );

    // ── Clipboard paste (for images) ──
    const handlePaste = useCallback((e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items || isStreaming || disabled) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              setPendingFiles((prev) => [
                ...prev,
                {
                  id: `f-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                  name: `粘贴图片-${new Date().toLocaleTimeString('zh-CN').replace(/:/g, '')}.png`,
                  type: 'image',
                  mimeType: item.type,
                  data: reader.result as string,
                  size: file.size,
                },
              ]);
            }
          };
          reader.readAsDataURL(file);
        }
      }
    }, [isStreaming, disabled]);

    return (
      <div
        className={`border-t px-4 pt-3 pb-4 z-10 flex-shrink-0 relative transition-colors ${
          dragOver
            ? darkMode
              ? 'backdrop-blur-[50px] saturate-[200%] brightness-[1.04] bg-white/[0.02] border-white/[0.06]'
              : 'backdrop-blur-[45px] saturate-[190%] brightness-[1.05] bg-white/[0.35] border-indigo-400/40'
            : darkMode
              ? 'backdrop-blur-[45px] saturate-[200%] brightness-[1.04] bg-white/[0.02] border-t border-white/[0.06]'
              : 'backdrop-blur-[45px] saturate-[190%] brightness-[1.05] bg-white/[0.30] border-t border-gray-200/20'
        }`}
        onPaste={handlePaste}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {dragOver && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className={`flex flex-col items-center gap-2 px-6 py-4 rounded-2xl ${
              darkMode
                ? 'bg-cyan-500/10 border-2 border-dashed border-cyan-500/40'
                : 'bg-indigo-50 border-2 border-dashed border-indigo-300'
            }`}>
              <UploadCloud className={`w-8 h-8 ${darkMode ? 'text-cyan-400' : 'text-indigo-500'}`} />
              <span className={`text-sm font-medium ${darkMode ? 'text-cyan-300' : 'text-indigo-600'}`}>
                释放文件以添加附件
              </span>
              <span className={`text-[11px] ${darkMode ? 'text-cyan-400/50' : 'text-indigo-400'}`}>
                支持图片和文本文件
              </span>
            </div>
          </div>
        )}
        <div className="max-w-3xl mx-auto">
          {/* Reply indicator */}
          {replyTo && (
            <div className={`mb-2 flex items-start gap-2 p-2 rounded-lg ${
              darkMode ? 'bg-purple-500/[0.06] border border-purple-500/15' : 'bg-purple-50 border border-purple-200'
            }`}>
              <Reply className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-purple-400/70 font-semibold block">回复消息</span>
                <span className="text-[11px] text-gray-400 line-clamp-1">{replyTo.message.content.slice(0, 100)}</span>
              </div>
              <button
                onClick={replyTo.onClear}
                className="p-0.5 rounded hover:bg-white/10 text-gray-500 hover:text-gray-300"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* OCR / Doc parsing indicator */}
          {(ocrPending || docParsing) && (
            <div className={`mb-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] ${
              darkMode ? 'bg-amber-500/10 text-amber-400/80 border border-amber-500/15' : 'bg-amber-50 text-amber-600 border border-amber-200'
            }`}>
              {ocrPending ? <ScanEye className="w-3 h-3 animate-pulse" /> : <FileSearch className="w-3 h-3 animate-pulse" />}
              {ocrPending ? '正在识别图片文字...' : '正在解析文档...'}
            </div>
          )}

          {/* Pending file previews */}
          {pendingFiles.length > 0 && (
            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
              {pendingFiles.map((file) => (
                <div
                  key={file.id}
                  className={`relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs group ${
                    darkMode
                      ? 'bg-white/[0.04] border border-white/[0.08]'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  {file.type === 'image' ? (
                    <>
                      <Image className={`w-3.5 h-3.5 ${darkMode ? 'text-purple-400' : 'text-purple-500'}`} />
                      <img src={file.data} alt={file.name} className="w-5 h-5 rounded object-cover flex-shrink-0" />
                    </>
                  ) : (
                    <FileText className={`w-3.5 h-3.5 ${darkMode ? 'text-cyan-400' : 'text-cyan-500'}`} />
                  )}
                  <span className={`max-w-[120px] truncate ${darkMode ? 'text-white/70' : 'text-gray-600'}`}>
                    {file.name}
                  </span>
                  <span className={`${darkMode ? 'text-white/30' : 'text-gray-400'}`}>
                    {formatSize(file.size)}
                  </span>
                  <button
                    onClick={() => removeFile(file.id)}
                    className={`ml-0.5 p-0.5 rounded transition-colors opacity-0 group-hover:opacity-100 ${
                      darkMode ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-100 text-red-500'
                    }`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {totalSize > 0 && (
                <span className={`text-[10px] ${darkMode ? 'text-white/30' : 'text-gray-400'}`}>
                  共 {pendingFiles.length} 个文件 · {formatSize(totalSize)}
                </span>
              )}
            </div>
          )}

          {/* Input area — Apple liquid glass pill (strong blur + crystal) */}
          <div className={`relative flex items-end gap-2.5 rounded-[28px] px-5 py-3.5 transition-all duration-300 ${
            darkMode
              ? isStreaming
                ? `glass-crystal backdrop-blur-[50px] saturate-[200%] bg-white/[0.025] border border-white/[0.06] shadow-lg`
                : `glass-crystal backdrop-blur-[45px] saturate-[200%] brightness-[1.05] bg-white/[0.035] border border-white/[0.06] focus-within:border-cyan-500/20 focus-within:shadow-[0_4px_40px_rgba(0,0,0,0.35),0_0_0_1px_rgba(0,180,255,0.06)] focus-within:bg-white/[0.05] shadow-sm`
              : `glass-crystal backdrop-blur-[40px] saturate-[190%] brightness-[1.06] bg-white/[0.45] border border-gray-200/30 focus-within:border-indigo-300/60 focus-within:shadow-[0_4px_24px_rgba(99,102,241,0.08),0_0_0_1px_rgba(99,102,241,0.06)] focus-within:bg-white/[0.55] shadow-sm`
          }`}>
            {/* Terminal prompt for dark mode — subtle */}
            {darkMode && (
              <span className="text-white/15 text-sm font-mono flex-shrink-0 pb-1 select-none">❯</span>
            )}
            <textarea
              ref={innerRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isStreaming
                  ? '正在生成回复…'
                  : disabled
                    ? '编辑模式中…'
                  : pendingFiles.length > 0
                    ? '输入消息（可选），Enter 发送 · Shift+Enter 换行'
                    : '输入消息'
              }
              disabled={disabled || isStreaming}
              className={`flex-1 resize-none bg-transparent text-sm outline-none max-h-[200px] py-1 leading-relaxed ${
                darkMode
                  ? 'text-white/80 placeholder-white/20'
                  : 'text-gray-800 placeholder-gray-400'
              }`}
            />

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={[...IMAGE_TYPES, ...TEXT_TYPES].join(',')}
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Action buttons */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {/* Voice input */}
              <VoiceInputButton
                onText={(text) => {
                  const newText = input + text;
                  setInput(newText);
                  if (voiceAutoSend && newText.trim()) {
                    setTimeout(() => handleSend(), 300);
                  }
                }}
                disabled={disabled || isStreaming}
              />

              {/* Prompt library */}
              <button
                onClick={() => { playClick(); onOpenPromptLibrary?.(); }}
                disabled={isStreaming || disabled}
                className={`p-2 rounded-xl transition-all duration-200 apple-btn disabled:opacity-20 disabled:cursor-not-allowed ${
                  darkMode
                    ? 'text-white/20 hover:text-white/50 hover:bg-white/[0.06]'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/60'
                }`}
                title={t('shortcuts.promptLibrary') + ' (Ctrl+P)'}
              >
                <BookOpen className="w-4 h-4" />
              </button>

              {/* Upload file */}
              <button
                onClick={() => { playClick(); fileInputRef.current?.click(); }}
                disabled={isStreaming || disabled}
                className={`p-2 rounded-xl transition-all duration-200 apple-btn disabled:opacity-20 disabled:cursor-not-allowed ${
                  darkMode
                    ? 'text-white/20 hover:text-white/50 hover:bg-white/[0.06]'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/60'
                }`}
                title="上传文件（图片、代码、文本）"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Web search toggle */}
              <button
                onClick={onToggleWebSearch}
                disabled={isStreaming || disabled}
                className={`inline-flex items-center gap-1.5 rounded-xl transition-all duration-200 apple-btn disabled:opacity-20 disabled:cursor-not-allowed ${
                  webSearch
                    ? 'px-2 py-2 ' + (darkMode
                      ? 'bg-white/[0.06] text-white/60 ring-1 ring-white/[0.08] shadow-sm'
                      : 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200')
                    : 'px-2 py-2 ' + (darkMode
                      ? 'text-white/20 hover:text-white/40 hover:bg-white/[0.04]'
                      : 'text-gray-400 hover:text-gray-500 hover:bg-gray-200/60')
                }`}
                title={webSearch ? '关闭联网搜索' : '开启联网搜索'}
              >
                <Globe className={`w-4 h-4 ${webSearch ? 'opacity-80' : ''}`} />
                {webSearch && (
                  <span className="text-[11px] font-medium whitespace-nowrap">联网</span>
                )}
              </button>

              {isStreaming ? (
                <button
                  onClick={onStop}
                  className={`p-2 rounded-2xl transition-all duration-200 apple-btn ${
                    darkMode
                      ? 'bg-white/[0.06] text-white/60 hover:bg-white/[0.12] shadow-sm'
                      : 'bg-rose-100 text-rose-600 hover:bg-rose-200'
                  }`}
                  title="停止生成"
                >
                  <Square className="w-3.5 h-3.5" fill="currentColor" />
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={(!input.trim() && pendingFiles.length === 0) || disabled}
                  className={`p-2 rounded-2xl transition-all duration-200 apple-btn disabled:opacity-15 disabled:cursor-not-allowed ${
                    darkMode
                      ? (input.trim() || pendingFiles.length > 0)
                        ? 'bg-white/[0.08] text-white/70 hover:bg-white/[0.14] shadow-sm'
                        : 'text-white/15'
                      : (input.trim() || pendingFiles.length > 0)
                        ? 'bg-gray-800 text-white hover:bg-gray-900 shadow-sm'
                        : 'text-gray-300'
                  }`}
                  title="发送 (Enter)"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Footer info bar */}
          <div className="flex items-center justify-between mt-3 px-1">
            <div className="flex items-center gap-2.5">
              {model && (
                <span className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium',
                  darkMode
                    ? 'glass-pill text-white/40'
                    : 'bg-gray-100 text-gray-500'
                )}>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    darkMode
                      ? 'bg-white/40 shadow-[0_0_4px_rgba(255,255,255,0.2)]'
                      : 'bg-emerald-500'
                  }`} />
                  {getModelLabel(model)}
                </span>
              )}
              {webSearch && (
                <span className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]',
                  darkMode
                    ? 'glass-pill text-white/40'
                    : 'bg-emerald-100 text-emerald-700'
                )}>
                  <Globe className="w-2.5 h-2.5" />
                  联网搜索
                </span>
              )}
              {isStreaming && (
                <span className={`inline-flex items-center gap-1.5 text-[11px] ${
                  darkMode ? 'text-white/30' : 'text-gray-500'
                }`}>
                  <div className="relative w-1.5 h-1.5">
                    <div className="absolute inset-0 rounded-full bg-white/40 animate-ping" />
                    <div className="absolute inset-0 rounded-full bg-white/40" />
                  </div>
                  思考中…
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {charCount > 0 && (
                <span className={`text-[11px] tabular-nums font-mono ${
                  darkMode ? 'text-white/20' : 'text-gray-400'
                }`}>
                  ≈{tokenEstimate.toLocaleString()} tokens
                </span>
              )}
              <span className={`text-[11px] ${
                darkMode ? 'text-white/10' : 'text-gray-400'
              }`}>{getModelLabel(model ?? DEFAULT_DEEPSEEK_MODEL)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
