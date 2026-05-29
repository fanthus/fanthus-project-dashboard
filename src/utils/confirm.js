import { confirm } from '@tauri-apps/plugin-dialog';

export async function confirmAction(message, { title = '请确认', kind = 'warning' } = {}) {
  try {
    return await confirm(message, {
      title,
      kind,
      okLabel: '确定',
      cancelLabel: '取消',
    });
  } catch {
    return window.confirm(message);
  }
}
