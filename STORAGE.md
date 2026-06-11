# Data Qi — Chiến lược lưu trữ (đã chốt)

## 1. Định dạng tài liệu
- **Nguồn sự thật:** JSON block tree (BlockNote) lưu trong Postgres `jsonb`.
- **Trao đổi:** export/import Markdown tự động (portable, tương thích Obsidian, đẩy nền tảng khác).
- Người dùng xem được cả 2 chế độ: đẹp như Notion / dạng MD.
- Lý do: JSON giữ được block phức tạp (callout, toggle, embed, cột) mà MD làm mất; MD lo phần portable.

## 2. ⚠️ Nguyên tắc vàng: KHÔNG lưu binary trong DB
- Ảnh/video/file KHÔNG lưu thẳng vào Postgres (phình DB, backup chậm, query nặng, không CDN, đắt gấp ~6 lần).
- DB chỉ lưu **đường dẫn (URL/path)**; file thật nằm ở object storage.

## 3. Phân tầng lưu trữ (đã chốt)
| Loại | Lưu ở đâu | Phục vụ user từ |
|------|-----------|-----------------|
| Page JSON, metadata, links, embeddings | Postgres (Supabase Cloud) | Cloud |
| Ảnh inline, thumbnail (hot) | Supabase Storage (Cloud, CDN) | Cloud |
| Video | Nhúng link (YouTube/Vimeo/Drive); bản gốc → Mac Mini | Link nhúng (KHÔNG serve từ Mac Mini) |
| Bản gốc nặng, raw footage, archive | Mac Mini 500TB (MinIO/NAS) | — (kho lạnh) |
| PDF/DOCX đẩy nền tảng | Object storage, sinh on-demand | Cloud |

## 4. Vai trò Mac Mini (đã chốt)
- **Chỉ là kho lạnh + backup**, một chiều (dữ liệu chảy VÀO).
- Internet nhà/upload yếu → **KHÔNG phục vụ user trực tiếp**.
- Nhiệm vụ:
  1. Nhận `pg_dump` Postgres hằng đêm.
  2. Giữ bản sao media (sync xuống từ cloud).
  3. Lưu bản gốc video nặng + raw footage.

## 5. An toàn (3-2-1)
- 3 bản sao · 2 loại lưu trữ · 1 off-site.
- DB: Supabase auto-backup + pg_dump → Mac Mini.
- Media: Supabase Storage ↔ sync Mac Mini.
- Mã hóa: at-rest (Supabase + FileVault trên Mac Mini) + in-transit (HTTPS).
- Phân quyền: RLS Postgres (vault cá nhân không rò chéo).

## 6. Việc cần xác minh sau (về Mac Mini)
- [ ] 500TB là ổ ngoài/RAID? Có chống hỏng đĩa (RAID/ZFS) không?
- [ ] Cài MinIO (S3-compatible) hay chỉ dùng SMB + script rsync?
- [ ] Lịch backup tự động (cron/launchd) trên macOS.

## 7. Kiến trúc tổng
```
   App (Vercel) ──► Supabase Cloud ──► Postgres + Auth + hot media (CDN)
                          │
                  backup  │  (một chiều, hằng đêm)
                          ▼
                   Mac Mini 500TB  ── kho lạnh + bản gốc video + off-site backup
```
