# ▶️ Akash — Việc làm tiếp (cập nhật 2026-06-17)

> Đọc cùng: `docs/AUDIT-2026-06-17.md` (audit + đề xuất view + function) · `docs/AKASH.md` (tổng) · `docs/WORKLOG.md` (nhật ký) · `docs/IMPROVEMENT.md` (sổ hiểu nhau) · memory `akash-project-state.md`.
> Chạy: `cd ~/Desktop/Akash/web && npm run dev`. Project Supabase: data QI `vntndprivvkgjbeutand` (KHÔNG đụng project thật 578 user).

## 🔴 Cần FOUNDER thao tác tay
- [ ] Dán `ANTHROPIC_API_KEY` + `OPENAI_API_KEY` vào **Supabase Edge secret** (không NEXT_PUBLIC) → bật `ai-standardize` + `rag-embed`.
- [ ] Supabase Dashboard → Authentication → **tắt "Allow new users to sign up"** (khoá cứng; app đã bỏ UI đăng ký).
- [ ] (deploy) `vercel login` → mình deploy: root `web` + 2 env NEXT_PUBLIC Supabase.

## A. Graph — view mới cho 6 chiều (đẹp hơn) — xem AUDIT §C
- [ ] **C1 Quỹ đạo theo chiều** (làm trước): chọn node → 6 vòng tròn màu = 6 chiều, neighbor bay trên vòng của chiều nối nó. Chỉ cần data `links`, render canvas.
- [ ] **C2 Vòng hợp âm (Chord)**: node gom theo kho, ruy-băng nối tô màu chiều — ảnh "wow".
- [ ] (tuỳ) C3 "6 bầu trời" (mỗi ô 1 chiều) · C4 Sankey dòng chảy kho→chiều→kho.

## B. Dọn code graph (tuỳ, không ảnh hưởng chạy) — xem AUDIT §B
- [ ] Galaxy: xoá code chết `depthCol`/`DEPTH_COLOR`/`depthColorOf`.
- [ ] Galaxy: quyết mode `rings` (~120 dòng không truy cập được) — xoá hay gắn lại nút.

## C. Đồng bộ docs còn lại — xem AUDIT §A
- [ ] Đổi "8 chiều"→"6 chiều liên kết (+2 thuộc tính)" ở APP-FLOWS, USER-STORIES, RAG-CHUNKING, AKASH §8.
- [ ] Thống nhất "Chuyển hoá" (bỏ "Thấm") ở FRAMEWORK §5, KHO-CHUAN, USER-STORIES.
- [ ] FRAMEWORK §4 bỏ hẳn radar 5 cạnh; AI-FRAMEWORK/ROADMAP đổi `profiles.voice`→`user_voice`.
- [ ] README: chốt MỘT thứ tự đọc docs.

## D. Tính năng tiếp theo (khi có key)
- [ ] **RAG search UI**: ô "Hỏi kho của tôi" → RPC `ask_my_vault` (wrap `match_chunks`, chỉ trong kho mình) → AI trả lời.
- [ ] **Sinh content theo giọng**: Edge `generate-content` từ bài đã Chuyển hoá + `user_voice.branding`.
- [ ] Tổng hợp DISC/MBTI từ "3 câu hôm nay" vào MeMirror (heuristic, không cần token).

## E. Function/hạ tầng cần chuẩn bị — xem AUDIT §E
- [ ] RPC `dim_link_stats(p_org)` cho view Chord/Sankey.
- [ ] (tuỳ) RPC `node_dim_summary(p_node)` cho view Quỹ đạo.
- [ ] (RAG) RPC `ask_my_vault(p_query)` + Edge `generate-content`.

## F. Test một vòng thực tế
- [ ] Cấp 1 tài khoản test (Nhân sự) → đăng nhập → giao việc gắn trang → xem thông báo Phòng biên tập → nộp → nghiệm thu (+Qi) → kiểm Snapshot/Khôi phục/Reset.
