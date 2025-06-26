# 🚀 Cloudflare Worker Request Monitor

Một dashboard real-time để monitoring các requests đến Cloudflare Worker của bạn, với giao diện đẹp mắt sử dụng Highcharts.

## ✨ Tính năng

- 📊 **Real-time Analytics**: Theo dõi requests theo thời gian thực
- 📈 **Beautiful Charts**: Sử dụng Highcharts với theme tối hiện đại
- 🌍 **Geo Analytics**: Phân tích requests theo quốc gia
- ⚡ **Performance Metrics**: Theo dõi response time và performance
- 📱 **Responsive Design**: Giao diện đẹp trên mọi thiết bị
- 🎨 **Modern UI**: Glassmorphism design với animations mượt mà

## 🚀 Các biểu đồ có sẵn

1. **Timeline Chart**: Requests theo thời gian
2. **HTTP Methods**: Phân bố các method (GET, POST, PUT, DELETE)
3. **Country Distribution**: Top countries gửi requests
4. **Response Time**: Tracking thời gian phản hồi

## 📦 Setup

### 1. Clone repository
```bash
git clone <your-repo-url>
cd cloudflare-request-monitor
```

### 2. Install dependencies
```bash
npm install
```

### 3. Tạo KV namespace
```bash
# Tạo KV namespace cho production
wrangler kv:namespace create "ANALYTICS_KV"

# Tạo KV namespace cho preview
wrangler kv:namespace create "ANALYTICS_KV" --preview
```

### 4. Cập nhật wrangler.toml
Thay thế `your_kv_namespace_id` và `your_preview_kv_namespace_id` trong `wrangler.toml` với IDs được tạo ở bước trên.

### 5. Deploy
```bash
# Development
npm run dev

# Production
npm run deploy
```

## 🎯 Cách sử dụng

### Xem Dashboard
Truy cập vào URL của Worker để xem dashboard:
```
https://your-worker.your-subdomain.workers.dev/
```

### API Endpoints

- `GET /` - Dashboard chính
- `GET /api/analytics` - Lấy dữ liệu analytics (JSON)
- `POST /api/clear` - Xóa tất cả dữ liệu
- `GET /any-path` - Bất kỳ request nào khác sẽ được track

### Generate Test Data
Nhấn nút "Generate Test Data" trên dashboard để tạo dữ liệu test.

## 📊 Dữ liệu được track

Mỗi request sẽ được lưu với thông tin:
- **Timestamp**: Thời gian request
- **Method**: HTTP method (GET, POST, etc.)
- **URL**: Path được request
- **User Agent**: Browser/client info
- **IP Address**: IP của client (từ CF-Connecting-IP)
- **Country**: Quốc gia (từ Cloudflare)
- **Response Time**: Thời gian xử lý
- **Status Code**: HTTP status code

## 🔧 Customization

### Thay đổi số lượng requests lưu trữ
Trong `index.ts`, tìm dòng:
```typescript
analytics.requests = analytics.requests.slice(0, 100);
```
Thay `100` thành số lượng mong muốn.

### Thêm custom tracking
Bạn có thể thêm logic tracking riêng trong function `logRequest()`.

### Styling
CSS được embedded trong HTML, bạn có thể tùy chỉnh trong function `getDashboardHTML()`.

## 📈 Performance

- Sử dụng KV storage để lưu trữ hiệu quả
- Boost module của Highcharts cho performance tốt
- Chỉ lưu 100 requests gần nhất (có thể tùy chỉnh)
- Auto-refresh mỗi 10 giây

## 🌟 Screenshots

Dashboard bao gồm:
- 📊 4 stat cards hiển thị metrics chính
- 📈 4 biểu đồ interactive với Highcharts
- 📋 Bảng requests chi tiết
- 🎛️ Controls để refresh, clear data và generate test data

## 🚀 Deployment Tips

1. **Custom Domain**: Thêm routes trong `wrangler.toml` để map custom domain
2. **Environment Variables**: Sử dụng `[vars]` section cho config
3. **Monitoring**: Sử dụng Cloudflare Analytics để monitor Worker performance

## 📝 Notes

- KV storage có giới hạn 1000 operations/day trên free plan
- Dashboard tự động refresh mỗi 10 giây
- Dữ liệu được lưu trữ permanent trong KV cho đến khi clear
- Responsive design hoạt động tốt trên mobile

## 🤝 Contributing

Feel free to submit issues và pull requests!

## 📄 License

MIT License - sử dụng tự do cho mọi mục đích!
