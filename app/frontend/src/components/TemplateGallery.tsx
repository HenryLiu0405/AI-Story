import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import type { ProjectTemplate as ProjectTemplateType, TemplateGenre } from '../types';
import { templatesApi } from '../services/api';

interface Props {
  onSelectTemplate: (template: ProjectTemplateType) => void;
}

const genreLabels: Record<TemplateGenre, { label: string; icon: string }> = {
  xuanhuan: { label: '玄幻升级流', icon: '⚔️' },
  mystery: { label: '悬疑推理', icon: '🔍' },
  urban: { label: '都市异能', icon: '🏙️' },
  romance: { label: '恋爱群像', icon: '💕' },
  scifi: { label: '科幻探索', icon: '🚀' },
};

const TemplateGallery: React.FC<Props> = ({ onSelectTemplate }) => {
  const [templates, setTemplates] = useState<ProjectTemplateType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState<TemplateGenre | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<ProjectTemplateType | null>(null);

  useEffect(() => {
    loadTemplates();
  }, [selectedGenre]);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const data = await templatesApi.getAll(selectedGenre || undefined);
      setTemplates(data);
    } catch {
      toast.error('加载模板失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = (template: ProjectTemplateType) => {
    onSelectTemplate(template);
  };

  const filteredTemplates = templates;

  return (
    <div className="template-gallery">
      {/* Genre filter tabs */}
      <div className="template-genre-tabs">
        <button
          className={`template-genre-tab ${selectedGenre === null ? 'active' : ''}`}
          onClick={() => setSelectedGenre(null)}
        >
          全部
        </button>
        {(Object.keys(genreLabels) as TemplateGenre[]).map((genre) => (
          <button
            key={genre}
            className={`template-genre-tab ${selectedGenre === genre ? 'active' : ''}`}
            onClick={() => setSelectedGenre(genre)}
          >
            {genreLabels[genre].icon} {genreLabels[genre].label}
          </button>
        ))}
      </div>

      {/* Template grid */}
      {isLoading ? (
        <div className="template-loading">加载模板中...</div>
      ) : filteredTemplates.length === 0 ? (
        <div className="template-empty">暂无模板</div>
      ) : (
        <div className="template-grid">
          {filteredTemplates.map((template) => {
            const memoryCount = template.template_data?.memories?.length || 0;
            const bibleCount = template.template_data?.story_bible_entries?.length || 0;
            const genreInfo = genreLabels[template.genre] || { label: template.genre, icon: '📦' };

            return (
              <div
                key={template.id}
                className={`template-card ${previewTemplate?.id === template.id ? 'expanded' : ''}`}
              >
                <div className="template-card-header">
                  <span className="template-genre-badge">{genreInfo.icon} {genreInfo.label}</span>
                </div>
                <h4 className="template-card-name">{template.name}</h4>
                <p className="template-card-desc">{template.description}</p>

                <div className="template-card-meta">
                  <span>📝 {memoryCount} 条记忆</span>
                  <span>📖 {bibleCount} 条圣经条目</span>
                </div>

                {/* Preview panel (expand on click) */}
                {previewTemplate?.id === template.id && (
                  <div className="template-preview">
                    <div className="template-preview-section">
                      <div className="template-preview-title">项目描述</div>
                      <p>{template.template_data?.project_description || '暂无描述'}</p>
                    </div>

                    {memoryCount > 0 && (
                      <div className="template-preview-section">
                        <div className="template-preview-title">包含的记忆 ({memoryCount})</div>
                        {template.template_data.memories.map((mem, i) => (
                          <div key={i} className="template-preview-item">
                            <span className="template-preview-item-type">[{mem.type}]</span>
                            <strong>{mem.title}</strong>
                            <p>{mem.content.slice(0, 150)}{mem.content.length > 150 ? '...' : ''}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {bibleCount > 0 && (
                      <div className="template-preview-section">
                        <div className="template-preview-title">包含的故事圣经 ({bibleCount})</div>
                        {template.template_data.story_bible_entries.map((entry, i) => (
                          <div key={i} className="template-preview-item">
                            <span className="template-preview-item-type">[{entry.category}]</span>
                            <strong>{entry.title}</strong>
                            <p>{entry.content.slice(0, 150)}{entry.content.length > 150 ? '...' : ''}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="template-card-actions">
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() =>
                      setPreviewTemplate(
                        previewTemplate?.id === template.id ? null : template
                      )
                    }
                  >
                    {previewTemplate?.id === template.id ? '收起预览' : '预览'}
                  </button>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => handleCreateProject(template)}
                  >
                    使用此模板
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TemplateGallery;
