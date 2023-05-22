import { MenuItem } from "primeng/api";

export const POTNodeMenu: MenuItem[] = [
  { label: 'Nuevo', icon: 'fas fa-comment-medical text-orange-500', id: 'add', disabled: true },
  { label: 'Editar', icon: 'fas fa-pen-to-square text-green-500', id: 'edit', disabled: true },
  { label: 'Copiar', icon: 'fas fa-copy text-cyan-500', id: 'copy', disabled: true },
  { label: 'Cortar', icon: 'fas fa-scissors text-blue-500', id: 'cut', disabled: true },
  { label: 'Pegar', icon: 'fas fa-paste text-teal-500', id: 'paste', disabled: true },
  { label: 'Traducir todo', icon: 'fas fa-wand-magic-sparkles text-yellow-500', id: 'translate', disabled: true },
  { separator: true },
  { label: 'Eliminar', icon: 'fas fa-trash-alt text-pink-500', id: 'remove', disabled: true },
]
