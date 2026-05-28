export const STATUS_OPTIONS = [
  { value: 'idea', label: '想法', tone: 'idea' },
  { value: 'active', label: '进行中', tone: 'active' },
  { value: 'paused', label: '暂停', tone: 'paused' },
  { value: 'shipped', label: '已上线', tone: 'shipped' },
  { value: 'archived', label: '已归档', tone: 'archived' },
];

export const statusLabel = (status) =>
  STATUS_OPTIONS.find((item) => item.value === status)?.label ?? status;

export const emptyProject = (overrides = {}) => ({
  id: '',
  name: '',
  path: '',
  description: '',
  status: 'active',
  tags: [],
  progress: '',
  nextSteps: '',
  scripts: [],
  createdAt: '',
  updatedAt: '',
  archivedAt: null,
  ...overrides,
});

export const formatDate = (value) => {
  if (!value) return '未记录';
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
};
