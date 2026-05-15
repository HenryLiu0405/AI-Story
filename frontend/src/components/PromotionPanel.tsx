import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { promotionApi } from '../services/api';
import type {
  PromotionPlatform,
  PromotionContentType,
  PromotionGenerateResponse,
} from '../types';

const PLATFORM_LABELS: Record<PromotionPlatform, { label: string; icon: string }> = {
  xiaohongshu: { label: '小红书', icon: '📕' },
  weibo: { label: '微博', icon: '🔵' },
  douyin: { label: '抖音', icon: '🎵' },
  bilibili: { label: 'B站', icon: '📺' },
  twitter: { label: 'Twitter', icon: '🐦' },
};

const CONTENT_TYPE_LABELS: Record<PromotionContentType, { label: string; icon: string }> = {
  character_card: { label: '角色卡文案', icon: '👤' },
  chapter_teaser: { label: '章节预告', icon: '📢' },
  world_intro: { label: '世界观介绍', icon: '🌍' },
  short_video_script: { label: '短视频脚本', icon: '🎬' },
  interactive_question: { label: '互动问题', icon: '💬' },
  submission_intro: { label: '投稿简介', icon: '📝' },
};

const TONE_OPTIONS = [
  '轻松活泼',
  '严肃文学',
  '热血燃',
  '悬疑惊悚',
  '甜宠撩人',
  '幽默吐槽',
  '文艺清新',
];

const READER_OPTIONS = [
  '网文读者',
  '出版读者',
  '剧本编辑',
  'ACGN 粉丝',
  '女性读者',
  '男性读者',
  '全年龄段',
];

interface Props {
  projectId: string;
  projectName: string;
}

const PromotionPanel: React.FC<Props> = ({ projectId, projectName }) => {
  const [platform, setPlatform] = useState<PromotionPlatform>('xiaohongshu');
  const [contentType, setContentType] = useState<PromotionContentType>('character_card');
  const [tone, setTone] = useState('轻松活泼');
  const [targetReader, setTargetReader] = useState('网文读者');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<PromotionGenerateResponse | null>(null);

  const handleGenerate = async () => {
    if (!projectId) return;
    setIsGenerating(true);
    try {
      const data = await promotionApi.generate(projectId, {
        platform,
        content_type: contentType,
        tone,
        target_reader: targetReader,
      });
      setResult(data);
      toast.success('文案生成成功！');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || '生成失败，请稍后重试';
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `${result.title}\n\n${result.content}\n\n${result.hashtags.join(' ')}\n\n💡 ${result.platform_tips}`;
    navigator.clipboard.writeText(text).then(
      () => toast.success('已复制到剪贴板！'),
      () => toast.error('复制失败，请手动复制')
    );
  };

  // Compact number input style for tone/reader
  const selectStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #3a3a5c',
    background: '#1e1e3a',
    color: '#e0e0e0',
    fontSize: '14px',
    cursor: 'pointer',
    outline: 'none',
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '22px' }}>📣 内容传播助手</h2>
        <p style={{ margin: 0, color: '#888', fontSize: '14px' }}>
          将《{projectName}》的设定转化为各平台宣传文案，一键生成，一键复制
        </p>
      </div>

      {/* Form */}
      <div
        style={{
          background: '#1a1a2e',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          border: '1px solid #2a2a4a',
        }}
      >
        {/* Platform selection */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#aaa', fontSize: '13px' }}>
            选择平台
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(Object.entries(PLATFORM_LABELS) as [PromotionPlatform, { label: string; icon: string }][]).map(
              ([key, { label, icon }]) => (
                <button
                  key={key}
                  onClick={() => setPlatform(key)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '20px',
                    border: platform === key ? '2px solid #7c5ce7' : '1px solid #3a3a5c',
                    background: platform === key ? '#2a1a5e' : '#1e1e3a',
                    color: platform === key ? '#c4b5fd' : '#aaa',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: platform === key ? 600 : 400,
                    transition: 'all 0.2s',
                  }}
                >
                  {icon} {label}
                </button>
              )
            )}
          </div>
        </div>

        {/* Content type selection */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#aaa', fontSize: '13px' }}>
            内容类型
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(Object.entries(CONTENT_TYPE_LABELS) as [PromotionContentType, { label: string; icon: string }][]).map(
              ([key, { label, icon }]) => (
                <button
                  key={key}
                  onClick={() => setContentType(key)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '20px',
                    border: contentType === key ? '2px solid #7c5ce7' : '1px solid #3a3a5c',
                    background: contentType === key ? '#2a1a5e' : '#1e1e3a',
                    color: contentType === key ? '#c4b5fd' : '#aaa',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: contentType === key ? 600 : 400,
                    transition: 'all 0.2s',
                  }}
                >
                  {icon} {label}
                </button>
              )
            )}
          </div>
        </div>

        {/* Tone + Target Reader */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: '#aaa', fontSize: '13px' }}>
              语气风格
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              style={{ ...selectStyle, width: '100%' }}
            >
              {TONE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: '#aaa', fontSize: '13px' }}>
              目标读者
            </label>
            <select
              value={targetReader}
              onChange={(e) => setTargetReader(e.target.value)}
              style={{ ...selectStyle, width: '100%' }}
            >
              {READER_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          style={{
            marginTop: '20px',
            width: '100%',
            padding: '12px',
            borderRadius: '10px',
            border: 'none',
            background: isGenerating
              ? 'linear-gradient(135deg, #5a4a9e, #4a3a8e)'
              : 'linear-gradient(135deg, #7c5ce7, #6c4ce7)',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 600,
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            opacity: isGenerating ? 0.7 : 1,
            transition: 'all 0.2s',
          }}
        >
          {isGenerating ? '⏳ 正在生成文案...' : '🚀 生成文案'}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div
          style={{
            background: '#1a1a2e',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #2a2a4a',
          }}
        >
          {/* Meta info */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '16px',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                background: '#2a1a5e',
                color: '#c4b5fd',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '12px',
              }}
            >
              {PLATFORM_LABELS[result.platform as PromotionPlatform]?.icon}{' '}
              {PLATFORM_LABELS[result.platform as PromotionPlatform]?.label}
            </span>
            <span
              style={{
                background: '#1a2e1a',
                color: '#86c486',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '12px',
              }}
            >
              {CONTENT_TYPE_LABELS[result.content_type as PromotionContentType]?.icon}{' '}
              {CONTENT_TYPE_LABELS[result.content_type as PromotionContentType]?.label}
            </span>
            <span
              style={{
                background: '#2e1a1a',
                color: '#c48686',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '12px',
              }}
            >
              🎭 {result.tone}
            </span>
          </div>

          {/* Title */}
          <h3
            style={{
              margin: '0 0 12px',
              fontSize: '18px',
              color: '#e0d0ff',
              lineHeight: 1.5,
            }}
          >
            {result.title}
          </h3>

          {/* Content */}
          <div
            className="markdown-body"
            style={{
              color: '#ccc',
              lineHeight: 1.8,
              fontSize: '15px',
              marginBottom: '16px',
              whiteSpace: 'pre-wrap',
            }}
          >
            <ReactMarkdown>{result.content}</ReactMarkdown>
          </div>

          {/* Hashtags */}
          {result.hashtags.length > 0 && (
            <div style={{ marginBottom: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {result.hashtags.map((tag, i) => (
                <span
                  key={i}
                  style={{
                    color: '#7cb8e4',
                    fontSize: '13px',
                    background: '#1a2a3e',
                    padding: '2px 8px',
                    borderRadius: '10px',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Platform tips */}
          {result.platform_tips && (
            <div
              style={{
                background: '#1e1e30',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '16px',
                borderLeft: '3px solid #7c5ce7',
              }}
            >
              <span style={{ color: '#aaa', fontSize: '12px' }}>💡 发布建议：</span>
              <span style={{ color: '#999', fontSize: '13px', marginLeft: '4px' }}>
                {result.platform_tips}
              </span>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleCopy}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: '1px solid #3a3a5c',
                background: '#2a2a4e',
                color: '#e0e0e0',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
            >
              📋 一键复制
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: '1px solid #5a4a9e',
                background: 'transparent',
                color: '#c4b5fd',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                opacity: isGenerating ? 0.5 : 1,
                transition: 'all 0.2s',
              }}
            >
              🔄 重新生成
            </button>
          </div>

          {/* Generated timestamp */}
          <div style={{ marginTop: '12px', color: '#555', fontSize: '11px' }}>
            生成时间：{new Date(result.generated_at).toLocaleString('zh-CN')}
          </div>
        </div>
      )}

      {/* Empty state - only show when no result yet */}
      {!result && !isGenerating && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#555',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📣</div>
          <p style={{ fontSize: '15px', margin: '0 0 8px' }}>
            选择平台、内容类型和风格，点击「生成文案」
          </p>
          <p style={{ fontSize: '13px', margin: 0 }}>
            AI 将基于项目设定自动生成适合平台传播的宣发内容
          </p>
        </div>
      )}
    </div>
  );
};

export default PromotionPanel;
