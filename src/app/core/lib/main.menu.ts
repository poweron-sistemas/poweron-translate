import { MenuItem } from "primeng/api";

export const POTMainMenu: MenuItem[] = [
  { title: 'Nuevo proyecto', icon: 'fas fa-file-circle-plus', id: 'new' },
  { title: 'Editar proyecto', icon: 'fas fa-file-pen text-green-500', id: 'project', disabled: true },
  { title: 'Eliminar proyecto', icon: 'fas fa-file-circle-xmark text-pink-500', id: 'clear', disabled: true },
  { title: 'Abrir proyecto', icon: 'fas fa-folder-open text-yellow-500', id: 'open' },
  { title: 'Guardar proyecto', icon: 'fas fa-save text-blue-500', id: 'download', disabled: true },
  { separator: true },
  { title: 'Deshacer [Control + Z]', icon: 'fas fa-rotate-left', id: 'undo', disabled: true },
  { title: 'Rehacer [Control + Y]', icon: 'fas fa-rotate-right', id: 'redo', disabled: true },
  { separator: true },
  { title: 'Nuevo [Control + I]', icon: 'fas fa-comment-medical text-orange-500', id: 'add', disabled: true },
  { title: 'Editar [F2]', icon: 'fas fa-pen-to-square text-green-500', id: 'edit', disabled: true },
  { title: 'Copiar [Control + C]', icon: 'fas fa-copy text-cyan-500', id: 'copy', disabled: true },
  { title: 'Cortar [Control + X]', icon: 'fas fa-scissors text-blue-500', id: 'cut', disabled: true },
  { title: 'Pegar [Control + V]', icon: 'fas fa-paste text-teal-500', id: 'paste', disabled: true },
  { title: 'Traducir todo [Control + B]', icon: 'fas fa-wand-magic-sparkles text-yellow-500', id: 'translate', disabled: true },
  { title: 'Eliminar [Supr]', icon: 'fas fa-trash-alt text-pink-500', id: 'remove', disabled: true },
  { separator: true },
  { title: 'Configuraciones', icon: 'fas fa-cog', id: 'settings' },
  { title: 'Subir', icon: 'fas fa-cloud-arrow-up text-cyan-500', id: 'upload', disabled: true },
  { title: 'Exportar', icon: 'fas fa-file-export text-teal-500', id: 'export', disabled: true },
  { separator: true },
  { title: 'Sobre nosotros', icon: 'fas fa-question-circle text-blue-300', url: 'https://www.poweronsistemas.com', target: '_blank' },
  { title: 'Repositorio', icon: 'fab fa-github', url: 'https://www.github.com/poweron-sistemas', target: '_blank' }
]
