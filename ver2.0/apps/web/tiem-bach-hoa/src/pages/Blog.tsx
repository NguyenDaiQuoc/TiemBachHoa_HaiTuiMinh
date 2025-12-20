import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import "../../css/blog.css";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function BlogPage() {
  const [searchParams] = useSearchParams();
  const tagFilter = searchParams.get("tag");

  const posts = [
    {
      id: 1,
      title: "Mẹo chọn đồ gia dụng bền – đẹp – chuẩn giá",
      slug: "meo-chon-do-gia-dung-ben-dep-chuan-gia",
      summary:
        "Hướng dẫn cách chọn các sản phẩm gia dụng phù hợp nhu cầu, bền bỉ và tiết kiệm chi phí cho gia đình.",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
      category: "Gia dụng",
      date: "12/2025",
      tags: ["gia dụng", "tiết kiệm", "chính hãng"],
    },
    {
      id: 2,
      title: "Mỹ phẩm chính hãng: Cách phân biệt thật – giả",
      slug: "my-pham-chinh-hang-cach-phan-biet-that-gia",
      summary:
        "Tụi mình chia sẻ các mẹo nhận biết mỹ phẩm chính hãng để bạn luôn an tâm khi sử dụng.",
      image: "https://images.unsplash.com/photo-1596464716127-7a7ab9150c5e",
      category: "Mỹ phẩm",
      date: "11/2025",
      tags: ["mỹ phẩm", "an toàn", "chính hãng"],
    },
    {
      id: 3,
      title: "Hướng dẫn mua đồ điện tử chuẩn hàng tốt",
      slug: "huong-dan-mua-do-dien-tu-chuan-hang-tot",
      summary:
        "Từ tai nghe, loa, đến máy cạo râu – đây là kinh nghiệm chọn đồ điện tử chính hãng với giá hợp lý.",
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8",
      category: "Điện tử",
      date: "10/2025",
      tags: ["điện tử", "giá tốt", "review"],
    },
  ];

  const filteredPosts = tagFilter
    ? posts.filter((post) => post.tags.includes(tagFilter))
    : posts;

  return (
    <div className="blog-wrapper">
      <Header />

      <section className="blog-hero">
        <h1 className="blog-title">
          {tagFilter ? `Bài viết về "${tagFilter}"` : "Chia sẻ từ Tiệm Bách Hoá Hai Tụi Mình"}
        </h1>
        <p className="blog-subtitle">
          {tagFilter ? (
            <>
              Hiển thị {filteredPosts.length} bài viết.{" "}
              <Link to="/blog" style={{ color: "#e74c3c", fontWeight: 600 }}>
                Xem tất cả
              </Link>
            </>
          ) : (
            "Nơi tụi mình kể bạn nghe về mẹo dùng đồ gia dụng, cách chọn mỹ phẩm an toàn, kinh nghiệm mua đồ điện tử chính hãng và nhiều điều hay ho khác."
          )}
        </p>
      </section>

      <section className="blog-list">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <div key={post.id} className="blog-card">
            <img src={post.image} alt={post.category} />
            <div className="blog-meta">
              <span className="badge">{post.category}</span>
              <span className="meta-date">{post.date}</span>
            </div>
            <h3>{post.title}</h3>
            <p>{post.summary}</p>
            <Link className="blog-btn" to={`/blog-detail/${post.slug}`}>
              Đọc thêm
            </Link>
          </div>
          ))
        ) : (
          <div style={{ textAlign: "center", padding: "60px 20px", gridColumn: "1 / -1" }}>
            <h3 style={{ fontSize: "24px", marginBottom: "12px", color: "#666" }}>
              Không tìm thấy bài viết nào
            </h3>
            <p style={{ color: "#999", marginBottom: "20px" }}>
              Không có bài viết nào với tag "{tagFilter}"
            </p>
            <Link className="blog-btn" to="/blog">
              Về trang Blog
            </Link>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
