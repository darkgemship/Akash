'use client'
import { Component, type ReactNode } from 'react'

// Chặn mọi lỗi render của con (vd: WebGL/three throw) — KHÔNG để kéo sập cả app, chỉ hiện fallback gọn.
export default class ErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; onError?: () => void },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onError?.() }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}
