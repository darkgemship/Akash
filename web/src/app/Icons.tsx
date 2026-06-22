'use client'
// Bộ icon line-style cho chrome chức năng (page/nội dung vẫn dùng emoji riêng của user)
import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number }
const base = (p: P) => {
  const { size = 18, ...rest } = p
  return { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, ...rest }
}

export const IVault = (p: P) => (<svg {...base(p)}><path d="M12 3 3.5 7.5 12 12l8.5-4.5L12 3Z" /><path d="M3.5 12 12 16.5 20.5 12" /><path d="M3.5 16.5 12 21l8.5-4.5" /></svg>)
export const IHome = (p: P) => (<svg {...base(p)}><path d="M4 10.5 12 4l8 6.5" /><path d="M6 9.5V20h12V9.5" /><path d="M10 20v-5h4v5" /></svg>)
export const IPen = (p: P) => (<svg {...base(p)}><path d="M14.5 5.5 18.5 9.5 8 20H4v-4L14.5 5.5Z" /><path d="m13 7 4 4" /></svg>)
export const IBoard = (p: P) => (<svg {...base(p)}><rect x="4" y="4" width="4.5" height="16" rx="1.2" /><rect x="10" y="4" width="4.5" height="10" rx="1.2" /><rect x="16" y="4" width="4.5" height="13" rx="1.2" /></svg>)
export const ICheck = (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12.5 2.4 2.4 4.6-5.4" /></svg>)
export const IUsers = (p: P) => (<svg {...base(p)}><circle cx="9" cy="9" r="3.2" /><path d="M3.5 19c.8-3 3-4.5 5.5-4.5S13.7 16 14.5 19" /><circle cx="16.5" cy="10" r="2.5" /><path d="M16 14.6c2.2.2 3.8 1.6 4.4 4" /></svg>)
export const IUser = (p: P) => (<svg {...base(p)}><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c1-3.8 3.8-5.5 7-5.5s6 1.7 7 5.5" /></svg>)
export const ISearch = (p: P) => (<svg {...base(p)}><circle cx="11" cy="11" r="6" /><path d="m20 20-4-4" /></svg>)
export const IPlus = (p: P) => (<svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>)
export const IDots = (p: P) => (<svg {...base(p)}><circle cx="5.5" cy="12" r="1.1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" /><circle cx="18.5" cy="12" r="1.1" fill="currentColor" stroke="none" /></svg>)
export const IChevron = (p: P) => (<svg {...base(p)}><path d="m9 6 6 6-6 6" /></svg>)
export const ILogout = (p: P) => (<svg {...base(p)}><path d="M14 4H6v16h8" /><path d="M10 12h10" /><path d="m17 8.5 3.5 3.5-3.5 3.5" /></svg>)
export const IDoc = (p: P) => (<svg {...base(p)}><path d="M7 3h7l4 4v14H7V3Z" /><path d="M14 3v4h4" /><path d="M10 12h5M10 16h5" /></svg>)
export const IOrbit = (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="3.2" /><ellipse cx="12" cy="12" rx="9" ry="4.2" transform="rotate(-22 12 12)" /><circle cx="19.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" /></svg>)
export const IUpload = (p: P) => (<svg {...base(p)}><path d="M12 16V5" /><path d="m7.5 9 4.5-4.5L16.5 9" /><path d="M4.5 19.5h15" /></svg>)
export const ICode = (p: P) => (<svg {...base(p)}><path d="m8.5 7-4.5 5 4.5 5" /><path d="m15.5 7 4.5 5-4.5 5" /></svg>)
export const ITarget = (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" /></svg>)
export const IRefresh = (p: P) => (<svg {...base(p)}><path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" /><path d="M19.5 3.5v4h-4" /></svg>)
export const IMegaphone = (p: P) => (<svg {...base(p)}><path d="M4 10v4h3l8 4V6l-8 4H4Z" /><path d="M18.5 9.5a3.5 3.5 0 0 1 0 5" /><path d="M7 14v5h3v-4" /></svg>)
export const IGrad = (p: P) => (<svg {...base(p)}><path d="m12 4 10 5-10 5L2 9l10-5Z" /><path d="M6.5 11.5V16c0 1.5 2.5 3 5.5 3s5.5-1.5 5.5-3v-4.5" /><path d="M22 9v5" /></svg>)
export const IX = (p: P) => (<svg {...base(p)}><path d="m6 6 12 12M18 6 6 18" /></svg>)
export const IExpand = (p: P) => (<svg {...base(p)}><path d="M9 5H5v4M15 5h4v4M9 19H5v-4M15 19h4v-4" /></svg>)
export const IEye = (p: P) => (<svg {...base(p)}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.8" /></svg>)
export const IEyeOff = (p: P) => (<svg {...base(p)}><path d="M4 4l16 16" /><path d="M9.9 5.9A9.4 9.4 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3 3.7M6.1 8.3A16 16 0 0 0 2.5 12S6 18.5 12 18.5a9 9 0 0 0 3.4-.7" /><path d="M9.5 9.8a2.8 2.8 0 0 0 4.4 3.4" /></svg>)
