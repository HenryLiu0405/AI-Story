import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import type { AuthorStyleProfile, StyleRewriteResponse } from '../types';
import { styleApi } from '../services/api';

interface Props {
  projectId: string;
}

const DIMENSION_LABELS: Record<string, { label: string; icon: string }> = {
  avg_sentence_length: { label: '句长偏好', icon: '📏' },
  narrative_pov: { label: '叙述视角', icon: '👁️' },
  dialogue_ratio: { label: '对话比例', icon: '💬' },
  emotion_density: { label: '情绪密度', icon: '💗' },
  rhetorical_devices: { label: '常用修辞', icon: '✨' },
  pacing: { label: '节奏特点', icon: '🎵' },
  forbidden_styles: { label: '禁用风格', icon: '🚫' },
  sample_rules: { label: '改写规则', icon: '📐' },
};

const AuthorStylePanel: React.FC<Props> = ({ projectId }) => {
  // Profile list
  const [profiles, setProfiles] = useState<AuthorStyleProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  // Create
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createName, setCreateName] = useState('');
  const [sampleText, setSampleText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Detail view
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  // Rewrite
  const [rewriteInput, setRewriteInput] = useState('');
  const [rewriteResult, setRewriteResult] = useState<StyleRewriteResponse | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);

  // Load profiles on mount
  useEffect(() => {
    loadProfiles();
  }, [projectId]);

  const loadProfiles = async () => {
    if (!projectId) return;
    setLoadingProfiles(true);
    try {
      const data = await styleApi.getByProject(projectId);
      setProfiles(data);
    } catch {
      toast.error('加载风格档案失败');
    } finally {
      setLoadingProfiles(false);
    }
  };

  // ------------------------------------------------------------------
  // Create
  // ------------------------------------------------------------------
  const handleCreate = async () => {
    if (!createName.trim()) {
      toast.error('请输入风格档案名称');
      return;
    }
    if (!sampleText.trim()) {
      toast.error('请粘贴您的作品样本文本');
      return;
    }
    if (sampleText.trim().length < 50) {
      toast.error('样本文本太短（至少50字），无法有效分析文风');
      return;
    }

    setIsAnalyzing(true);
    try {
      const profile = await styleApi.create(projectId, {
        name: createName.trim(),
        sample_text: sampleText.trim(),
      });
      setProfiles((prev) => [profile, ...prev]);
      setShowCreateForm(false);
      setCreateName('');
      setSampleText('');
      setSelectedProfileId(profile.id);
      toast.success('文风分析完成！');
    } catch {
      toast.error('分析文风失败，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ------------------------------------------------------------------
  // Delete
  // ------------------------------------------------------------------
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除这个风格档案吗？')) return;
    try {
      await styleApi.delete(id);
      setProfiles((prev) => prev.filter((p) => p.id !== id));
      if (selectedProfileId === id) {
        setSelectedProfileId(null);
        setRewriteResult(null);
        setRewriteInput('');
      }
      toast.success('风格档案已删除');
    } catch {
      toast.error('删除失败');
    }
  };

  // ------------------------------------------------------------------
  // Rewrite
  // ------------------------------------------------------------------
  const handleRewrite = async () => {
    if (!rewriteInput.trim() || !selectedProfileId || isRewriting) return;
    setIsRewriting(true);
    setRewriteResult(null);
    try {
      const result = await styleApi.rewrite(selectedProfileId, {
        text: rewriteInput.trim(),
      });
      setRewriteResult(result);
    } catch {
      toast.error('改写失败，请重试');
    } finally {
      setIsRewriting(false);
    }
  };

  // ------------------------------------------------------------------
  // Render helpers
  // ------------------------------------------------------------------
  const renderDimensionValue = (key: string, value: unknown) => {
    if (key === 'rhetorical_devices' && Array.isArray(value)) {
      return value.length > 0 ? value.join('、') : '（无明显修辞特征）';
    }
    if (key === 'forbidden_styles' && Array.isArray(value)) {
      return value.length > 0 ? value.join('；') : '（无特定禁用风格）';
    }
    if (key === 'sample_rules' && Array.isArray(value)) {
      if (value.length === 0) return '（无示例规则）';
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {value.map((rule: any, idx: number) => (
            <div
              key={idx}
              style={{
                background: 'var(--bg-secondary)',
                padding: '8px 12px',
                borderRadius: 6,
                fontSize: '0.8rem',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 2 }}>{rule.dimension}</div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                {rule.description}
              </div>
              {rule.example && (
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontStyle: 'italic' }}>
                  {rule.example}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }
    return String(value || '—');
  };

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <div className="sidebar-section" style={{ maxHeight: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>🎨 文风 DNA</span>
        <button
          className="btn btn-sm btn-secondary"
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            setRewriteResult(null);
          }}
        >
          {showCreateForm ? '取消' : '+ 新建档案'}
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <input
            className="input"
            placeholder="档案名称（如：第一卷风格）"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            style={{ marginBottom: 8 }}
            maxLength={100}
          />
          <textarea
            className="input"
            placeholder="粘贴您的作品样本文本（500-3000字为佳）...&#10;系统将分析句长、叙述视角、对话比例、情绪密度、修辞偏好和节奏特点。"
            value={sampleText}
            onChange={(e) => setSampleText(e.target.value)}
            rows={6}
            style={{ marginBottom: 8, resize: 'vertical' }}
            maxLength={5000}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.7rem',
              color: 'var(--text-secondary)',
              marginBottom: 8,
            }}
          >
            <span>已输入 {sampleText.length} 字</span>
            <span>建议 500–3000 字</span>
          </div>
          <button
            className="btn btn-sm btn-primary btn-block"
            onClick={handleCreate}
            disabled={isAnalyzing || sampleText.trim().length < 50}
          >
            {isAnalyzing ? '⏳ 正在分析文风 DNA...' : '🔍 分析文风'}
          </button>
          {isAnalyzing && (
            <div style={{ textAlign: 'center', padding: '12px 0 4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              AI 正在逐维度分析您的写作风格，请稍候...
            </div>
          )}
        </div>
      )}

      {/* Profile list */}
      {loadingProfiles && (
        <div style={{ textAlign: 'center', padding: 16, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          加载中...
        </div>
      )}

      {!loadingProfiles && profiles.length === 0 && !showCreateForm && (
        <div style={{ textAlign: 'center', padding: '24px 12px' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎨</div>
          <div style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: 4 }}>
            还没有风格档案
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
            粘贴一段您的作品样本，让 AI 分析您的独特文风
          </div>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => setShowCreateForm(true)}
          >
            + 开始分析
          </button>
        </div>
      )}

      {profiles.map((profile) => (
        <div
          key={profile.id}
          onClick={() => {
            setSelectedProfileId(
              selectedProfileId === profile.id ? null : profile.id
            );
            if (selectedProfileId !== profile.id) {
              setRewriteResult(null);
              setRewriteInput('');
            }
            setShowCreateForm(false);
          }}
          style={{
            background:
              selectedProfileId === profile.id
                ? 'var(--bg-secondary)'
                : 'transparent',
            borderRadius: 8,
            padding: '10px 12px',
            marginBottom: 8,
            cursor: 'pointer',
            border:
              selectedProfileId === profile.id
                ? '1px solid var(--accent-color)'
                : '1px solid transparent',
            transition: 'all 0.15s',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 4 }}>
                {profile.name}
              </div>
              <div
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-secondary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {profile.style_summary || '（暂无摘要）'}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                {new Date(profile.created_at).toLocaleDateString('zh-CN')}
              </div>
            </div>
            <button
              className="btn btn-sm"
              onClick={(e) => handleDelete(profile.id, e)}
              style={{
                padding: '2px 8px',
                fontSize: '0.7rem',
                color: 'var(--text-secondary)',
                marginLeft: 8,
              }}
              title="删除"
            >
              🗑️
            </button>
          </div>

          {/* Expanded detail */}
          {selectedProfileId === profile.id && (
            <div style={{ marginTop: 12, borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
              {/* Style summary */}
              {profile.style_summary && !profile.style_summary.startsWith('（') && (
                <div
                  style={{
                    background: 'var(--bg-primary)',
                    borderRadius: 6,
                    padding: '8px 12px',
                    marginBottom: 12,
                    fontSize: '0.8rem',
                    lineHeight: 1.6,
                  }}
                >
                  <ReactMarkdown>{profile.style_summary}</ReactMarkdown>
                </div>
              )}

              {/* Dimensions grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                {Object.entries(profile.rules_json || {}).map(([key, value]) => {
                  if (key === 'sample_rules') return null; // rendered separately
                  const info = DIMENSION_LABELS[key];
                  if (!info) return null;
                  return (
                    <div
                      key={key}
                      style={{
                        background: 'var(--bg-primary)',
                        borderRadius: 6,
                        padding: '8px 10px',
                      }}
                    >
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                        {info.icon} {info.label}
                      </div>
                      <div style={{ fontSize: '0.78rem', lineHeight: 1.4 }}>
                        {renderDimensionValue(key, value)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Sample rules */}
              {profile.rules_json?.sample_rules &&
                profile.rules_json.sample_rules.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        color: 'var(--text-secondary)',
                        marginBottom: 6,
                      }}
                    >
                      📐 示例改写规则
                    </div>
                    {renderDimensionValue('sample_rules', profile.rules_json.sample_rules)}
                  </div>
                )}

              {/* Rewrite test area */}
              <div
                style={{
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: 12,
                  marginTop: 4,
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 8 }}>
                  ✍️ 改写测试
                </div>
                <textarea
                  className="input"
                  placeholder="输入一段文本，测试按此风格改写..."
                  value={rewriteInput}
                  onChange={(e) => setRewriteInput(e.target.value)}
                  rows={3}
                  style={{ marginBottom: 8, resize: 'vertical' }}
                />
                <button
                  className="btn btn-sm btn-primary btn-block"
                  onClick={handleRewrite}
                  disabled={isRewriting || !rewriteInput.trim()}
                >
                  {isRewriting ? '⏳ 改写中...' : '🔄 按此风格改写'}
                </button>

                {/* Rewrite result */}
                {rewriteResult && (
                  <div style={{ marginTop: 12 }}>
                    {rewriteResult.changes_summary && (
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--accent-color)',
                          marginBottom: 8,
                          padding: '6px 8px',
                          background: 'var(--bg-primary)',
                          borderRadius: 4,
                        }}
                      >
                        📝 {rewriteResult.changes_summary}
                      </div>
                    )}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 8,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: '0.65rem',
                            color: 'var(--text-secondary)',
                            marginBottom: 4,
                          }}
                        >
                          📄 原文
                        </div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            background: 'var(--bg-primary)',
                            borderRadius: 4,
                            padding: '8px',
                            lineHeight: 1.5,
                            maxHeight: 200,
                            overflowY: 'auto',
                          }}
                        >
                          {rewriteResult.original_text}
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: '0.65rem',
                            color: 'var(--text-secondary)',
                            marginBottom: 4,
                          }}
                        >
                          ✨ 改写后
                        </div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            background: 'var(--bg-primary)',
                            borderRadius: 4,
                            padding: '8px',
                            lineHeight: 1.5,
                            maxHeight: 200,
                            overflowY: 'auto',
                            borderLeft: '2px solid var(--accent-color)',
                          }}
                        >
                          {rewriteResult.rewritten_text}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AuthorStylePanel;
