# Thay đổi

## 2026-11-14

- Nút tải luôn có sẵn, mờ và không bấm được khi đang kiểm tra; có kết quả thì bật liên kết phù hợp. Giữ chỗ cho trạng thái và hàng nút để khung không nhảy; ảnh phủ kín khung mà vẫn giữ tỷ lệ.
- Khôi phục bảng chi tiết gọn ở giữa, có khoảng trống quanh khung trên mobile. Chỉ dịch dọc 10px khi mở 180ms và đóng 140ms, không trượt cả màn hình, zoom hay fade nội dung. Chế độ giảm chuyển động mở và đóng trực tiếp.
- Nạp và giải mã ảnh chi tiết trước khi thẻ vào màn hình, tái sử dụng ảnh khi mở lại và ưu tiên ảnh đang được chọn.
- Thẻ dự án fade một lần khi vào màn hình; hover chuyển động chỉ chạy với con trỏ chính xác.
- Chuyển focus ban đầu của bảng chi tiết về tiêu đề, giữ viền focus cho các nút và liên kết khi dùng bàn phím.
- Đổi biểu tượng GitHub sang logo chính thức từ Octicons.
- Xóa README.md theo yêu cầu của chủ dự án.

## 2026-11-13

- Bổ sung JARVIS, PUW Notch, Puw Player và Lenovo Toolkit, mỗi dự án trỏ đến repository riêng.
- Dùng tên chủ dự án `erikpuw` viết thường xuyên suốt website.
- Dựng giao diện sáng/tối theo mẫu đã duyệt, với hình minh họa và icon Phosphor lưu cục bộ.
- Thêm bảng chi tiết, morph khi trình duyệt hỗ trợ, điều khiển bằng bàn phím và chế độ giảm chuyển động.
- Giữ đúng tỷ lệ hình trên thẻ, dùng ảnh dọc riêng cho chi tiết và fade hai mép hero để hòa vào nền.
- Cho ảnh chi tiết trên mobile phủ kín khung ngang, giữ tỷ lệ và cắt phần dư.
- Thêm nút tải tệp Windows từ bản phát hành ổn định mới nhất; có trạng thái khi chưa có bản phát hành hoặc GitHub không trả dữ liệu.
- Thu hẹp fade hai bên trên desktop, giữ nguyên fade mobile và giảm kích thước hiển thị của nút đóng.

Bản thay đổi được chuẩn bị cục bộ. Chủ dự án tự kiểm tra và push lên GitHub Pages.
