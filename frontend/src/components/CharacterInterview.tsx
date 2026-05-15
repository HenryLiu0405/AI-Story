import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import type { Memory, CharacterInterviewResponse } from '../types';
import { characterApi } from '../services/api';

interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
  voice_notes?: string;
  possible_new_memory?: { title: string; content: string } | null;
}

interface Props {
  memory: Memory;
  projectId: string;
  onClose: () => void;
  onSaveMemory?: (title: string, content: string) => void;
}

const QUICK_QUESTIONS = [
  { label: '😨 恐惧', question: '你内心最深处的恐惧是什么？' },
  { label: '🔥 欲望', question: '你最渴望得到的是什么？' },
  { label: '🤫 秘密', question: '你是否有不愿意让别人知道的秘密？' },
  { label: '💔 背叛', question: '你曾经被背叛过吗？或者你背叛过别人吗？' },
  { label: '👥 关系', question: '你怎么看待你身边最亲近的那些人？' },
  { label: '🎬 回忆', question: '你记忆中最难忘的一个场景是什么？' },
];

const CharacterInterview: React.FC<Props> = ({ memory, projectId, onClose, onSaveMemory }) => {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVoicePanel, setShowVoicePanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const buildConversationHistory = (): { role: string; content: string }[] => {
    return turns.map((t) => ({
      role: t.role,
      content: t.content,
    }));
  };

  const sendQuestion = async (question: string) => {
    if (!question.trim() || isLoading) return;

    const q = question.trim();
    setInputValue('');
    setIsLoading(true);

    // Add user turn immediately
    setTurns((prev) => [...prev, { role: 'user', content: q }]);

    try {
      const history = buildConversationHistory();
      const response: CharacterInterviewResponse = await characterApi.interview(
        projectId,
        memory.id,
        {
          question: q,
          conversation_history: history,
        }
      );

      setTurns((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.answer,
          voice_notes: response.voice_notes,
          possible_new_memory: response.possible_new_memory || null,
        },
      ]);
    } catch (err) {
      toast.error('访谈请求失败，请检查网络或AI服务配置');
      setTurns((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '（抱歉，我现在好像无法回应……可能是连接出了问题。）',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQuestion(inputValue);
    }
  };

  const handleSaveNewMemory = (title: string, content: string) => {
    if (onSaveMemory) {
      onSaveMemory(title, content);
      toast.success(`新记忆「${title}」已保存`);
    }
  };

  const lastVoiceNotes =
    [...turns].reverse().find((t) => t.role === 'assistant' && t.voice_notes)?.voice_notes || '';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: 640, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 className="modal-title">
              🎭 访谈：{memory.title}
            </h3>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              以角色身份回答 · 不会跳出角色
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setShowVoicePanel(!showVoicePanel)}
              title="声线笔记"
            >
              🎤
            </button>
            <button className="modal-close" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, minHeight: 0, gap: 12 }}>
          {/* Chat Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* Messages */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0 4px',
                minHeight: 200,
              }}
            >
              {turns.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    padding: '40px 20px',
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: 12 }}>💬</div>
                  <p>
                    点击下方问题模板或输入你的问题，<br />
                    开始与 <strong>{memory.title}</strong> 对话
                  </p>
                </div>
              )}

              {turns.map((turn, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: turn.role === 'user' ? 'flex-end' : 'flex-start',
                    marginBottom: 16,
                  }}
                >
                  {turn.role === 'assistant' && (
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'var(--primary-color)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        marginRight: 8,
                        flexShrink: 0,
                      }}
                    >
                      {memory.title.charAt(0)}
                    </div>
                  )}
                  <div style={{ maxWidth: '80%' }}>
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: 12,
                        fontSize: '0.875rem',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                        background:
                          turn.role === 'user'
                            ? 'var(--primary-color)'
                            : 'var(--bg-color)',
                        color:
                          turn.role === 'user' ? 'white' : 'var(--text-primary)',
                      }}
                    >
                      <ReactMarkdown>{turn.content}</ReactMarkdown>
                    </div>

                    {/* Voice notes on last assistant message */}
                    {turn.role === 'assistant' && turn.voice_notes && (
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: '0.7rem',
                          color: 'var(--text-secondary)',
                          fontStyle: 'italic',
                          padding: '4px 8px',
                          background: '#fef3c7',
                          borderRadius: 6,
                        }}
                      >
                        🎤 {turn.voice_notes}
                      </div>
                    )}

                    {/* Save-as-memory button */}
                    {turn.role === 'assistant' &&
                      turn.possible_new_memory?.title &&
                      turn.possible_new_memory?.content && (
                        <button
                          className="btn btn-sm btn-secondary"
                          style={{ marginTop: 6, fontSize: '0.7rem' }}
                          onClick={() =>
                            handleSaveNewMemory(
                              turn.possible_new_memory!.title,
                              turn.possible_new_memory!.content
                            )
                          }
                        >
                          💾 保存为记忆：「{turn.possible_new_memory.title}」
                        </button>
                      )}
                  </div>
                  {turn.role === 'user' && (
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'var(--text-secondary)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        marginLeft: 8,
                        flexShrink: 0,
                      }}
                    >
                      👤
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 16 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'var(--primary-color)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.875rem',
                      marginRight: 8,
                    }}
                  >
                    {memory.title.charAt(0)}
                  </div>
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 12,
                      background: 'var(--bg-color)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem',
                    }}
                  >
                    正在思考...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                padding: '8px 0',
                borderTop: '1px solid var(--border-color)',
              }}
            >
              {QUICK_QUESTIONS.map((qq) => (
                <button
                  key={qq.label}
                  className="btn btn-sm btn-secondary"
                  onClick={() => sendQuestion(qq.question)}
                  disabled={isLoading}
                  style={{ fontSize: '0.7rem' }}
                >
                  {qq.label}
                </button>
              ))}
            </div>

            {/* Input Area */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                padding: '8px 0 0',
                borderTop: '1px solid var(--border-color)',
              }}
            >
              <input
                ref={inputRef}
                type="text"
                className="form-input"
                placeholder={`向 ${memory.title} 提问...`}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                style={{ flex: 1 }}
              />
              <button
                className="btn btn-primary"
                onClick={() => sendQuestion(inputValue)}
                disabled={isLoading || !inputValue.trim()}
              >
                发送
              </button>
            </div>
          </div>

          {/* Voice Notes Side Panel */}
          {showVoicePanel && (
            <div
              style={{
                width: 200,
                borderLeft: '1px solid var(--border-color)',
                paddingLeft: 12,
                overflowY: 'auto',
                fontSize: '0.8rem',
              }}
            >
              <h4 style={{ marginBottom: 8, fontSize: '0.85rem' }}>🎤 声线笔记</h4>
              {lastVoiceNotes ? (
                <div
                  style={{
                    background: '#fef3c7',
                    padding: 10,
                    borderRadius: 8,
                    lineHeight: 1.6,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {lastVoiceNotes}
                </div>
              ) : (
                <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  访谈开始后，AI 会分析角色的语气特点、用词习惯和句式偏好。
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CharacterInterview;
