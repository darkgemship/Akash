---
name: improve-system
description: Phản tư cuối phiên — nhìn lại những gì vừa xảy ra trong session và cập nhật "Internal OS" của dự án để phản ánh nó. Dùng khi user gõ /improve-system (hoặc nói "cải thiện hệ thống", "chốt phiên", "rút kinh nghiệm phiên này"). Cập nhật instructions của skill nếu đã iterate output của nó; lưu bài học/câu chuyện vào knowledge/me/experiences/; gắn cờ thứ gì stale hoặc trùng lặp.
---

# improve-system — Tự cải thiện hệ thống sau mỗi phiên

Khi user gọi skill này, **nhìn lại CHÍNH phiên hiện tại** (những gì vừa làm, sửa, học) và cập nhật "Internal OS" của dự án để lần sau tốt hơn. Đây là vòng phản tư — KHÔNG build tính năng mới, chỉ chưng cất kinh nghiệm thành hệ thống.

## "Internal OS" trong dự án này gồm

| Lớp | File / nơi lưu | Khi nào động vào |
|---|---|---|
| Trí nhớ Claude (xuyên phiên) | `~/.claude/projects/<project>/memory/` + `MEMORY.md` | Khi có fact/preference/feedback đáng nhớ về user hoặc dự án |
| Quyết định & rules | `docs/DECISIONS.md` | Khi có quyết định mới được chốt hoặc rule mới |
| Nhật ký công việc | `docs/WORKLOG.md` (hoặc `WORKLOG.md`) | Ghi lại đợt build vừa rồi |
| Skills | `.claude/skills/<name>/SKILL.md` | Khi đã iterate output của một skill |
| Trải nghiệm cá nhân | `knowledge/me/experiences/` | Khi user kể một bài học hoặc câu chuyện |

## Quy trình (chạy theo thứ tự)

### 1. Quét lại phiên
Đọc lại transcript phiên hiện tại. Trả lời trong đầu:
- Mình **đã sửa/iterate output của skill nào** chưa? (user bảo "không, làm lại thế này", "đổi giọng", "ngắn hơn"…)
- User có **kể bài học / câu chuyện / nguyên tắc sống** nào không?
- Có **quyết định mới** nào được chốt không?
- Có gì **stale (lỗi thời) hoặc trùng lặp** mình thấy không?

### 2. Nếu đã iterate output của một skill → cập nhật instructions skill đó
Khi user phải sửa kết quả của skill X nhiều lần theo cùng một hướng, đó là tín hiệu instructions của X thiếu. Mở `.claude/skills/X/SKILL.md`, thêm/chỉnh rule để **lần sau ra đúng ngay** mà không cần user sửa lại. Ghi ngắn gọn "đã học từ phiên: …".

### 3. Nếu user chia sẻ bài học/câu chuyện → lưu vào experiences
Tạo `knowledge/me/experiences/<YYYY-MM-DD>-<slug>.md`:
```markdown
---
date: <ngày thật, không phải ngày tạo file>
tags: [bài-học | câu-chuyện | nguyên-tắc]
---

# <Tiêu đề ngắn>

<Bối cảnh — chuyện gì xảy ra>

**Bài học:** <điều rút ra>
**Áp dụng:** <lần sau làm gì khác>
```
Dùng `event_date` thật (chuyện quá khứ → ngày quá khứ), theo rule trục thời gian của dự án.

### 4. Cập nhật trí nhớ & docs
- Fact/feedback đáng nhớ về user hoặc cách làm việc → ghi vào memory (`~/.claude/.../memory/`) + thêm 1 dòng index ở `MEMORY.md`. Trước khi tạo mới, kiểm tra file đã tồn tại để **update thay vì trùng**.
- Quyết định mới → thêm vào `docs/DECISIONS.md`. Rule mới → mục Rules.
- Tóm tắt đợt vừa làm → `docs/WORKLOG.md` (hoặc `WORKLOG.md` ở gốc).

### 5. Gắn cờ stale / trùng lặp (KHÔNG tự xoá)
Nếu thấy doc/memory/skill lỗi thời, mâu thuẫn, hoặc trùng nội dung — **liệt kê ra cho user kèm đề xuất** (gộp / sửa / xoá), rồi chờ user quyết. Không tự ý xoá tri thức.

## Đầu ra cuối cùng
Báo cáo ngắn gọn cho user dạng checklist: đã cập nhật những file nào, đã lưu experience nào, và **danh sách "cờ"** (stale/trùng) cần user duyệt. Trung thực: việc nào bỏ qua vì không có gì để cập nhật thì nói rõ.

## Nguyên tắc
- Không bịa thay đổi. Nếu phiên không có gì đáng chưng cất, nói thẳng "phiên này không có gì mới để cập nhật".
- Update > tạo mới (tránh phình tài liệu).
- Mọi thay đổi phải truy ra được từ chuyện đã thật sự xảy ra trong phiên.
