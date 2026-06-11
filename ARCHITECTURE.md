# Data Qi — Kiến trúc dự án

> Một nền tảng biến tri thức tổ chức + trải nghiệm cá nhân thành thu nhập số.
> "Turn life experience into money on the internet."

## 1. Vision & 4 lớp sản phẩm

| Lớp | Tên | Vai trò |
|-----|-----|---------|
| 🧠 L1 — Knowledge | Second Brain | Vault chung (QNET) + vault cá nhân, link kiểu Obsidian, đẹp kiểu Notion, có template chuẩn hóa |
| ✍️ L2 — Content Engine | Ghostwriter AI | AI học từ vault + trải nghiệm → sinh caption/script/video, lịch đăng đa nền tảng |
| 📈 L3 — Marketing | Growth Dept | Ads, SEO, analytics tự động |
| 💰 L4 — Business | Outcome | Solo entrepreneur kiếm $1–3k/tháng → sign-up QNET $10k |

**Insight cốt lõi (vòng lặp dữ liệu hai chiều):**
```
Kho QNET (chung) ──┐
                   ├──► AI (RAG) ──► Content cá nhân hóa ──► Thu nhập
Vault cá nhân ─────┘        ▲                                   │
   (thói quen ghi chú) ─────┴──── học style/feedback user ◄─────┘
```
Lợi thế cạnh tranh tích lũy: càng nhiều người ghi chú, AI viết càng "đúng giọng" họ — thứ Notion/Obsidian không có.

## 2. Tech stack

| Mảng | Lựa chọn | Lý do |
|------|----------|-------|
| Frontend | Next.js (App Router) + TypeScript + Tailwind | Full-stack, ship nhanh, deploy Vercel |
| Editor | **BlockNote** (trên Tiptap/ProseMirror) | Editor block kiểu Notion sẵn, hỗ trợ mention/`[[link]]`, lưu JSON. KHÔNG tự xây từ 0. |
| Backend/DB | **Supabase** (Postgres) | Auth + Storage + Realtime + **pgvector** + RLS trong một. Đã kết nối sẵn. |
| Phân quyền | Postgres RLS | Ranh giới org-vault vs personal-vault enforce ở tầng DB |
| AI sinh nội dung | Claude API (claude-opus-4-8 / claude-sonnet-4-6) | Chất lượng viết content |
| Embeddings (RAG) | Voyage AI → pgvector | Vector search trên chính Postgres |
| Graph view | react-force-graph / Cytoscape | Đồ thị tri thức |
| Hosting | Vercel + Supabase Cloud | |

## 3. Mô hình dữ liệu (multi-tenant, RLS)

```
organizations(id, name, slug, created_at)
memberships(user_id → auth.users, org_id, role[owner|admin|member])
profiles(id → auth.users, full_name, avatar_url, voice_profile jsonb)

pages(
  id, org_id, owner_id,
  vault_type[org|personal],      -- chung hay cá nhân
  title, icon, parent_id,        -- cây thư mục
  content jsonb,                 -- tài liệu BlockNote (nguồn sự thật)
  is_template bool, template_of, -- template chuẩn hóa
  published_at, version,         -- versioning tài liệu tuần
  created_at, updated_at
)

links(id, org_id, from_page, to_page)      -- backlink + graph (bi-directional)

embeddings(                                 -- RAG
  id, org_id, page_id, owner_id, vault_type,
  chunk_index, content text, embedding vector(1024)
)

content_pieces(                             -- L2
  id, org_id, owner_id, source_page_id,
  platform[facebook|instagram|tiktok|youtube|x],
  type[caption|script|video], title, body,
  status[draft|scheduled|posted], scheduled_at, media_url
)
```

**Nguyên tắc RLS (xương sống bảo mật):**
- Org vault: member trong org đọc được; admin/owner mới sửa.
- Personal vault: chỉ owner đọc/sửa (private tuyệt đối).
- `embeddings` & `content_pieces` kế thừa đúng ranh giới đó → RAG không bao giờ rò dữ liệu cá nhân của người này sang người khác.

## 4. Lộ trình build (vertical slices)

Mỗi slice là một lát cắt chạy được end-to-end, không phải "làm xong backend rồi mới tới frontend".

- **Slice 0 — Scaffold:** Next.js + Supabase + Auth + organizations/memberships + Tailwind. → đăng nhập được, có org.
- **Slice 1 — Personal Vault:** Pages CRUD + BlockNote editor + sidebar cây thư mục. → ghi chú được ngay.
- **Slice 2 — Org Vault + Templates:** vault chung, roles, publish tài liệu tuần, template. → admin đẩy đào tạo cho 1000 member.
- **Slice 3 — Liên kết tri thức:** `[[mention]]` + panel backlink + graph view. → "cảm giác Obsidian".
- **Slice 4 — AI bắt đầu (L2):** embed pages → RAG → "Biến page này thành post theo giọng tôi" → content library. → **AI lên hình.**
- **Slice 5 — Content Engine:** lịch nội dung, lên kế hoạch, đăng (thủ công trước).
- **Sau:** API nền tảng (FB/IG/TikTok/YouTube) → L3 ads/SEO/analytics.

> "Cả hai song song": nền L1 ở Slice 0–3, AI (L2) khởi động ở Slice 4 — chỉ vài tuần, không phải chờ hết L1. Từ Slice 4 trở đi hai lớp tiến hóa cùng nhau.

## 5. Cấu trúc thư mục dự kiến

```
/app
  /(auth)/login
  /(app)/vault            # cây vault + danh sách page
  /(app)/page/[id]        # editor
  /(app)/graph            # đồ thị tri thức
  /(app)/content          # content library (L2)
  /api/ai/generate        # gọi Claude
/lib
  /supabase               # client + types
  /ai                     # claude, embeddings, rag
/components
  /editor                 # wrapper BlockNote
  /graph
/supabase/migrations      # SQL schema + RLS
```

## 6. Rủi ro & nguyên tắc

1. **Scope:** 4 lớp là tham vọng — tuyệt đối theo thứ tự slice, không nhảy cóc sang ads/SEO sớm.
2. **Editor:** không tự xây Notion-clone → dùng BlockNote.
3. **Giả thuyết kinh doanh:** content có thực sự dẫn tới sign-up QNET? → cần instrument analytics từ sớm để kiểm chứng, đừng đoán.
4. **Multi-tenant:** `org_id` ở mọi bảng ngay từ đầu = bảo hiểm rẻ cho tầm nhìn SaaS.
```
