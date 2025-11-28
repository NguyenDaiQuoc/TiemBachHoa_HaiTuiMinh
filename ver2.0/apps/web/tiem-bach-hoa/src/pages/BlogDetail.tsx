import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import SalesFloatingButton from "../components/SalesFloatingButton";
import "../../css/blogdetail.css";

// ─── BLOG DATA ───────────────────────────────────────────
const blogData = {
  title: "Review Chi Tiết: Máy Sấy Tóc Ion Âm Giá Rẻ, Đáng Mua Nhất 2025",
  author: "Admin Cửa Hàng",
  date: "Ngày 05 tháng 12, 2025",
  category: "Đồ Điện Tử & Sức Khỏe",
  readTime: "8 phút đọc",
  imageUrl:
    "https://via.placeholder.com/1200x600/E5D3BD?text=Hinh+Anh+May+Say+Toc+Ion+Am",
  content: [
    {
      type: "paragraph",
      text:
        "Trong thời đại bận rộn, việc tìm kiếm những sản phẩm gia dụng và thiết bị điện tử chính hãng với mức giá tốt là ưu tiên hàng đầu..."
    },
    { type: "heading", text: "1. Thiết Kế Tối Giản, Phù Hợp Mọi Không Gian Nhà" },
    {
      type: "paragraph",
      text: "Chiếc máy sấy tóc này không chỉ sở hữu công nghệ Ion Âm giúp bảo vệ tóc..."
    },
    {
      type: "quote",
      text: "“Chúng tôi cam kết cung cấp hàng chính hãng với mức giá cạnh tranh nhất...”"
    },
    { type: "heading", text: "2. Hiệu Năng Vượt Trội So Với Tầm Giá" },
    {
      type: "paragraph",
      text: "Với công suất 1800W, máy sấy tóc này đảm bảo làm khô tóc nhanh chóng..."
    },
    {
      type: "list",
      items: [
        "Công nghệ Ion Âm bảo vệ tóc",
        "Công suất 1800W mạnh mẽ",
        "Nhỏ gọn – phù hợp du lịch",
        "Giá bán chỉ bằng 80% thị trường"
      ]
    }
  ],
  tags: ["đồ điện tử", "sản phẩm cá nhân", "giá rẻ", "review", "chính hãng"]
};

// ─── RELATED POSTS ───────────────────────────
const relatedPosts = [
  { title: "Top 5 Mỹ Phẩm Hàn Quốc Giá Tốt", date: "28/11/2025" },
  { title: "Hướng dẫn chọn máy hút bụi", date: "20/11/2025" },
  { title: "Bí quyết bảo quản đồ điện tử", date: "15/11/2025" }
];

// ─── CONTENT RENDERER ───────────────────────────
function ContentRenderer({ content }) {
  return (
    <div className="blog-content">
      {content.map((block, i) => {
        switch (block.type) {
          case "paragraph":
            return (
              <p key={i} className="blog-paragraph">
                {block.text}
              </p>
            );

          case "heading":
            return (
              <h3 key={i} className="blog-subtitle">
                {block.text}
              </h3>
            );

          case "quote":
            return (
              <blockquote key={i} className="blog-quote">
                {block.text}
              </blockquote>
            );

          case "list":
            return (
              <ul key={i} className="blog-list">
                {block.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────
export default function BlogDetailPage() {
  return (
    <>
      <Header />
      <FloatingButtons />
      {/* <SalesFloatingButton /> */}

      <div className="blog-wrapper">
        <div className="blog-container">
          {/* HEADER */}
          <header className="blog-header">
            <span className="blog-category">{blogData.category}</span>

            <h1 className="blog-title">{blogData.title}</h1>

            <div className="blog-meta">
              <span>Bởi {blogData.author}</span>
              <span>| {blogData.date}</span>
              <span>| ⏱ {blogData.readTime}</span>
            </div>
          </header>

          {/* IMAGE */}
          <div className="blog-image-box">
            <img src={blogData.imageUrl} alt={blogData.title} />
          </div>

          {/* MAIN LAYOUT */}
          <div className="blog-layout">
            {/* LEFT CONTENT */}
            <div className="blog-main">
              <ContentRenderer content={blogData.content} />

              {/* Tags */}
              <div className="blog-tags">
                <span className="tag-label">Tags:</span>
                {blogData.tags.map((tag) => (
                  <span key={tag} className="tag-item">
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Sharing */}
              <div className="blog-share">
                <span>Chia sẻ:</span>
                <span className="share-ico">📘</span>
                <span className="share-ico">📷</span>
                <span className="share-ico">📱</span>
              </div>
            </div>

            {/* SIDEBAR */}
            <aside className="blog-sidebar">
              <h3 className="sidebar-title">Bài Viết Liên Quan</h3>

              {relatedPosts.map((post, i) => (
                <div key={i} className="sidebar-item">
                  <p className="sidebar-item-title">{post.title}</p>
                  <p className="sidebar-date">{post.date}</p>
                </div>
              ))}

              <button className="sidebar-button">Xem Tất Cả Blog</button>
            </aside>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
