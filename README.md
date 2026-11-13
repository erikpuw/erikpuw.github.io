# erikpuw

Website giới thiệu các dự án Windows của [erikpuw](https://github.com/erikpuw), tại [erikpuw.github.io](https://erikpuw.github.io/).

- [JARVIS](https://github.com/erikpuw/jarvis-windows): trợ lý AI với giọng nói tiếng Việt.
- [PUW Notch](https://github.com/erikpuw/puw_notch): nhạc và tiện ích trên desktop.
- [Puw Player](https://github.com/erikpuw/puw-player): trình nghe nhạc offline.
- [Lenovo Toolkit](https://github.com/erikpuw/lenovo-toolkit): tiện ích nguồn, quạt và pin cho laptop Lenovo được hỗ trợ.

## Xem trên máy

Mở `index.html` bằng trình duyệt. Website dùng HTML, CSS và JavaScript tĩnh, không cần cài thư viện hay chạy build.

Nếu muốn xem qua HTTP, chạy từ thư mục repository:

```powershell
rtk proxy python -m http.server 4173 --bind 127.0.0.1
```

Sau đó mở [localhost:4173](http://localhost:4173). Dừng server bằng `Ctrl+C`.

## Giao diện

Website có giao diện sáng và tối theo hệ thống; nút trên thanh điều hướng cho phép đổi và lưu lựa chọn trên trình duyệt. Mỗi thẻ mở bảng chi tiết với liên kết đến đúng repository.

Trình duyệt có View Transitions sẽ hiển thị morph khi mở và đóng chi tiết. Khi bật giảm chuyển động, hoặc trình duyệt chưa có API này, nội dung vẫn mở được mà không chạy morph. Có thể đóng bằng nút đóng, phím `Esc` hoặc bấm ngoài bảng.

Ảnh trên thẻ và ảnh chi tiết giữ tỷ lệ gốc. Hero fade hai bên và phía dưới để hòa vào nền. Tất cả ảnh và icon đều nằm trong repository.

## Chỉnh nội dung và kiểm tra

Sửa nội dung, liên kết và các `template` trong `index.html`. Màu sắc, bố cục và chuyển động nằm trong `styles.css`; thao tác sáng/tối và bảng chi tiết nằm trong `app.js`.

Chạy kiểm tra bằng Node.js 20 trở lên:

```powershell
rtk proxy node --test tests/site.test.mjs
rtk proxy node --check app.js
```

Trước khi push, xem lại cả hai giao diện trên desktop và mobile, thử từng dự án, phím `Esc` và liên kết GitHub. Kiểm tra tự động không thay thế việc xem trực tiếp.

## Hình ảnh và ghi công

Hình minh họa được tạo riêng cho website, không phải ảnh chụp giao diện ứng dụng. Hai ảnh atlas chứa hình cho các thẻ; mỗi bảng chi tiết có ảnh dọc riêng để tránh kéo giãn.

Icon thuộc bộ [Phosphor Regular](https://github.com/phosphor-icons/core), theo giấy phép MIT tại [assets/PHOSPHOR-LICENSE.txt](assets/PHOSPHOR-LICENSE.txt). Dữ liệu SVG được nhúng trong CSS để icon hoạt động cả khi mở tệp trực tiếp.

Website dùng cấu hình GitHub Pages của repository. Các thay đổi được chuẩn bị cục bộ để chủ dự án tự push.
