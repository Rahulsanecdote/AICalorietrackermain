import { useState } from 'react';
import { X, Save, Star, Trash2 } from 'lucide-react';
import { MealPlanTemplate } from '../types';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description?: string) => void;
  templates?: MealPlanTemplate[];
  onLoadTemplate?: (templateId: string) => void;
  onDeleteTemplate?: (templateId: string) => void;
}

export default function TemplateModal({
  isOpen,
  onClose,
  onSave,
  templates = [],
  onLoadTemplate,
  onDeleteTemplate,
}: TemplateModalProps) {
  const [activeTab, setActiveTab] = useState<'save' | 'load'>('save');
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (templateName.trim()) {
      onSave(templateName.trim(), templateDescription.trim() || undefined);
      setTemplateName('');
      setTemplateDescription('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {activeTab === 'save' ? 'Save Template' : 'Load Template'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('save')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'save'
                ? 'text-emerald-600 border-b-2 border-emerald-500'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            Save Current
          </button>
          <button
            onClick={() => setActiveTab('load')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'load'
                ? 'text-emerald-600 border-b-2 border-emerald-500'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            Load Template ({templates.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {activeTab === 'save' ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="template-name" className="block text-sm font-medium text-foreground mb-2">
                  Template Name
                </label>
                <input
                  id="template-name"
                  name="template-name"
                  type="text"
                  autoComplete="off"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., High Protein Day"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  maxLength={50}
                />
              </div>

              <div>
                <label htmlFor="template-description" className="block text-sm font-medium text-foreground mb-2">
                  Description (Optional)
                </label>
                <textarea
                  id="template-description"
                  name="template-description"
                  autoComplete="off"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Brief description of this meal plan..."
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  rows={3}
                  maxLength={200}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-1">
                  Save Current Plan
                </h3>
                <p className="text-sm text-blue-600">
                  This will save your current meal plan as a template that you can reuse later.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-muted-foreground mb-2">
                    <Star className="w-12 h-12 mx-auto" />
                  </div>
                  <h3 className="text-sm font-medium text-foreground mb-1">No templates saved</h3>
                  <p className="text-sm text-muted-foreground">
                    Save your first meal plan template to reuse it later
                  </p>
                </div>
              ) : (
                templates.map((template) => (
                  <div
                    key={template.id}
                    className="bg-card rounded-lg p-4 border border-border"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-foreground">{template.name}</h3>
                          {template.isFavorite && (
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                        {template.description && (
                          <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {onLoadTemplate && (
                          <button
                            onClick={() => {
                              onLoadTemplate(template.id);
                              onClose();
                            }}
                            className="px-3 py-1 text-xs bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors"
                          >
                            Load
                          </button>
                        )}
                        {onDeleteTemplate && (
                          <button
                            onClick={() => onDeleteTemplate(template.id)}
                            className="p-1 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(template.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors"
          >
            Cancel
          </button>
          {activeTab === 'save' && (
            <button
              onClick={handleSave}
              disabled={!templateName.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              Save Template
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
