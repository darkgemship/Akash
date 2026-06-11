# Data Qi — App Flows & Button Map (đã build)

> Tài liệu kỹ thuật của app thật trong `/web`. Mỗi nút → làm gì → chạm function/bảng nào. Để sửa nhanh, không lệch logic.

## Stack
- **Next.js 16** (App Router, Turbopack) · React · TypeScript · Tailwind
- **BlockNote** (editor block kiểu Notion) — `Editor.tsx`
- **Supabase** project `data QI` (`vntndprivvkgjbeutand`): Postgres + Auth + RLS
- Files: `web/src/app/page.tsx` (app chính), `Galaxy.tsx`, `Editor.tsx`, `Digest.tsx`, `lib/supabaseClient.ts`

## Data model (bảng chính)
```
organizations · profiles · memberships(level,can_edit,can_approve,sponsor_id)
groups · membership_groups · node_groups
nodes(layer[personal|corporate|humanity], kind[kho|folder|note|block],
      parent_id=CONTAINS, content jsonb=BlockNote, md, min_level, status)
links(from_node,to_node,dimension,weight,source)   ← GRAPH (typed)
wisdom_depth(node_id,user_id, connections/meaning/evidence/experience/action, learned)
node_versions(version, content, md, changelog)
```
RPC: `bootstrap_me()` · `seed_qnet(org)` · helpers `is_member/my_level/can_edit_org` · `auto_confirm_user`.

## Luồng đã chạy
1. **Auth** → `signUp/signIn` (auto-confirm) → `onAuthStateChange`.
2. **Bootstrap** → `rpc('bootstrap_me')` tạo org + membership L5 + root kho.
3. **Vault CRUD** → tạo folder (bài học lớn) / note → bảng `nodes`.
4. **Editor** → bấm note → `Editor.tsx` (BlockNote) → autosave `content`+`md`.
5. **Galaxy** → đọc `nodes`+`links` → vẽ (contains=thẳng, links=cong) → click mở.
6. **Digest** → 5 bước → ghi `wisdom_depth` + tạo `links` (bước Nối) → Độ Thấm.
7. **Seed QNET** → `rpc('seed_qnet')` → canon corporate + humanity (gate level).

## 🗺️ Button map (mọi nút → hành động)
| Nút / UI | Vị trí | Hành động | Function/Bảng |
|----------|--------|-----------|----------------|
| Đăng nhập/Đăng ký | Login | auth | `supabase.auth` |
| Đăng xuất | Header | signOut | `supabase.auth.signOut` |
| 📂 Thư mục / 🌌 Galaxy | Header | đổi view | `setView` |
| ＋ Tạo bài học lớn | Sidebar 🧠 | tạo folder personal | `addFolder` → `nodes` |
| 📁 folder (3 kho) | Sidebar | mở folder | `openFolder` → notes + `loadDepth` |
| ⬇ Seed QNET | Sidebar 🌐 | nạp canon | `seedQnet` → `rpc seed_qnet` |
| ＋ Note | Folder view | tạo note | `addNote` → `nodes` |
| 📝 note | Folder view | mở editor | `openNoteEditor` → modal `Editor` |
| 🎓 Học bài | Folder header | mở digest | `setShowDigest` → `Digest` |
| Digest "Hoàn thành" | Digest | ghi Độ Thấm + link | `wisdom_depth` upsert + `links` upsert |
| ✕ editor | Modal | đóng | `setEditing(null)` |

## Cần làm để "mọi nút hữu dụng" + main feature
- [ ] Editor: **tiêu đề sửa được** + **trang con (nested page)** + toggle xem Markdown
- [ ] Editor tools (Editor role): Upload/Versions/Link/Quyền/Gửi duyệt — nối RPC thật
- [ ] 5 trang: Today / Content Engine / Board / Profile
- [ ] Đổi mật khẩu trong Profile

## Cách chạy
```
cd web && npm run dev   # http://localhost:3000
```
Env: `web/.env.local` (URL + publishable key).
