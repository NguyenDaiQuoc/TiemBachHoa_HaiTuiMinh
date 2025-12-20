import React from "react";
import { Link, useParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";
import "../../css/blogdetail.css";

type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; items: string[] };

type BlogPost = {
  slug: string;
  title: string;
  summary: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
  imageUrl: string;
  tags: string[];
  content: ContentBlock[];
};

const blogPosts: BlogPost[] = [
  {
    slug: "meo-chon-do-gia-dung-ben-dep-chuan-gia",
    title: "Mẹo chọn đồ gia dụng bền – đẹp – chuẩn giá",
    summary:
      "Checklist nhanh để chọn đồ gia dụng vừa bền vừa đẹp, không lo mua hớ và dùng lâu dài.",
    author: "Hai Tụi Mình",
    date: "12/2025",
    category: "Gia dụng",
    readTime: "6 phút đọc",
    imageUrl:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
    tags: ["gia dụng", "tiết kiệm", "chính hãng"],
    content: [
      {
        type: "paragraph",
        text:
          "Chọn đồ gia dụng đừng chỉ nhìn giá. Hãy ưu tiên vật liệu bền, bảo hành rõ ràng và thương hiệu có trung tâm bảo hành gần bạn.",
      },
      { type: "heading", text: "1. Ưu tiên vật liệu và thương hiệu" },
      {
        type: "list",
        items: [
          "Inox 304 cho đồ bếp, nhựa PP cho hộp bảo quản",
          "Thương hiệu có linh kiện thay thế dễ tìm",
          "Tem bảo hành, mã QR kiểm tra chính hãng",
        ],
      },
      { type: "heading", text: "2. Tính năng đủ dùng, tránh mua thừa" },
      {
        type: "paragraph",
        text:
          "Một chiếc nồi chiên 4L là đủ cho gia đình 3-4 người. Chọn thiết bị đa năng chỉ khi bạn thật sự cần để không lãng phí tiền.",
      },
      {
        type: "quote",
        text: "Chọn đồ bền rẻ cần công thức: vật liệu tốt + bảo hành rõ + tính năng vừa đủ.",
      },
    ],
  },
  {
    slug: "my-pham-chinh-hang-cach-phan-biet-that-gia",
    title: "Mỹ phẩm chính hãng: Cách phân biệt thật – giả",
    summary:
      "3 bước kiểm tra nhanh để bạn không dính mỹ phẩm giả: bao bì, kết cấu và mã xác thực.",
    author: "Beauty Team",
    date: "11/2025",
    category: "Mỹ phẩm",
    readTime: "7 phút đọc",
    imageUrl:
      "https://images.unsplash.com/photo-1596464716127-7a7ab9150c5e?auto=format&fit=crop&w=1400&q=80",
    tags: ["mỹ phẩm", "an toàn", "chính hãng"],
    content: [
      {
        type: "paragraph",
        text:
          "Mỹ phẩm giả thường đánh lừa bằng giá rẻ và bao bì gần giống. Đừng bỏ qua mã QR, font chữ, tem niêm phong và mùi sản phẩm.",
      },
      { type: "heading", text: "1. Soi bao bì và tem" },
      {
        type: "list",
        items: [
          "Font chữ sắc nét, không lem",
          "Tem niêm phong còn nguyên",
          "Có mã vạch/QR tra cứu được trên trang hãng",
        ],
      },
      { type: "heading", text: "2. Kiểm tra kết cấu" },
      {
        type: "paragraph",
        text:
          "Chất kem giả thường có mùi cồn mạnh, lên da vón cục. Hàng chuẩn thấm nhanh, không gây nóng rát bất thường.",
      },
      {
        type: "quote",
        text: "Nếu giá rẻ hơn thị trường 40% mà không có lý do, hãy dừng lại và kiểm tra kỹ.",
      },
    ],
  },
  {
    slug: "huong-dan-mua-do-dien-tu-chuan-hang-tot",
    title: "Hướng dẫn mua đồ điện tử chuẩn hàng tốt",
    summary:
      "Tụi mình gợi ý cách chọn tai nghe, loa, máy cạo râu chính hãng với mức giá hợp lý nhất.",
    author: "Tech Team",
    date: "10/2025",
    category: "Điện tử",
    readTime: "8 phút đọc",
    imageUrl:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1400&q=80",
    tags: ["điện tử", "giá tốt", "review"],
    content: [
      {
        type: "paragraph",
        text:
          "Khi mua đồ điện tử, hãy xem chính sách đổi trả và địa chỉ bảo hành. Sản phẩm chính hãng luôn đi kèm số serial và phiếu bảo hành điện tử.",
      },
      { type: "heading", text: "1. Kiểm tra bảo hành và serial" },
      {
        type: "list",
        items: [
          "Serial trùng giữa hộp và thân máy",
          "Bảo hành điện tử kích hoạt được ngay",
          "Phụ kiện đầy đủ theo niêm yết",
        ],
      },
      { type: "heading", text: "2. So sánh giá thông minh" },
      {
        type: "paragraph",
        text:
          "Chênh lệch giá hợp lý thường 5-15%. Nếu rẻ hơn quá nhiều, hãy nghi ngờ nguồn gốc hoặc chính sách hậu mãi.",
      },
      {
        type: "quote",
        text: "Giá tốt phải đi cùng hậu mãi rõ ràng, đó mới là món hời bền vững.",
      },
    ],
  },
];

function ContentRenderer({ content }: { content: ContentBlock[] }) {
  return (
    <div className="blog-content">
      {content.map((block, i) => {
        if (block.type === "paragraph") {
          return (
            <p key={i} className="blog-paragraph">
              {block.text}
            </p>
          );
        }

        if (block.type === "heading") {
          return (
            <h3 key={i} className="blog-subtitle">
              {block.text}
            </h3>
          );
        }

        if (block.type === "quote") {
          return (
            <blockquote key={i} className="blog-quote">
              {block.text}
            </blockquote>
          );
        }

        if (block.type === "list") {
          return (
            <ul key={i} className="blog-list">
              {block.items.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          );
        }

        return null;
      })}
    </div>
  );
}

export default function BlogDetailPage() {
  const { slug } = useParams();
  const currentPost = blogPosts.find((post) => post.slug === slug);

  if (!currentPost) {
    return (
      <>
        <Header />
        <FloatingButtons />
        <div className="blog-wrapper">
          <div className="blog-container">
            <div className="blog-header">
              <h1 className="blog-title">Bài viết không tồn tại</h1>
              <p className="blog-paragraph">
                Có thể liên kết đã cũ hoặc bài viết đã được gỡ. Bạn hãy quay về trang Blog nhé.
              </p>
              <Link className="sidebar-button" to="/blog">
                Về trang Blog
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const relatedPosts = blogPosts.filter((post) => post.slug !== currentPost.slug).slice(0, 3);

  return (
    <>
      <Header />
      <FloatingButtons />

      <div className="blog-wrapper">
        <div className="blog-container">
          <header className="blog-header">
            <span className="blog-category">{currentPost.category}</span>
            <h1 className="blog-title">{currentPost.title}</h1>
            <p className="blog-subtitle">{currentPost.summary}</p>

            <div className="blog-meta">
              <span>Bởi {currentPost.author}</span>
              <span>| {currentPost.date}</span>
              <span>| ⏱ {currentPost.readTime}</span>
            </div>
          </header>

          <div className="blog-image-box">
            <img src={currentPost.imageUrl} alt={currentPost.title} />
          </div>

          <div className="blog-layout">
            <div className="blog-main">
              <ContentRenderer content={currentPost.content} />

              <div className="blog-tags">
                <span className="tag-label">Tags:</span>
                {currentPost.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="tag-item"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>

              <div className="blog-share">
                <span>Chia sẻ:</span>
                <span className="share-ico" aria-label="share-facebook">
                  📘
                </span>
                <span className="share-ico" aria-label="share-instagram">
                  📷
                </span>
                <span className="share-ico" aria-label="share-zalo">
                  📱
                </span>
              </div>
            </div>

            <aside className="blog-sidebar">
              <h3 className="sidebar-title">Bài Viết Liên Quan</h3>

              {relatedPosts.map((post) => (
                <div key={post.slug} className="sidebar-item">
                  <Link to={`/blog-detail/${post.slug}`} className="sidebar-item-title">
                    {post.title}
                  </Link>
                  <p className="sidebar-date">{post.date}</p>
                </div>
              ))}

              <Link className="sidebar-button" to="/blog">
                Xem Tất Cả Blog
              </Link>
            </aside>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
