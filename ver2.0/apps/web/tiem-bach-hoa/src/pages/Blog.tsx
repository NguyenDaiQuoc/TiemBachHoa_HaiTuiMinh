import React from "react";
import "../../css/blog.css";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function BlogPage() {
  return (
    <div className="blog-wrapper">
      <Header />

      <section className="blog-hero">
        <h1 className="blog-title">Chia sẻ từ Tiệm Bách Hoá Hai Tụi Mình</h1>
        <p className="blog-subtitle">
          Nơi tụi mình kể bạn nghe về mẹo dùng đồ gia dụng, cách chọn mỹ phẩm an toàn,
          kinh nghiệm mua đồ điện tử chính hãng và nhiều điều hay ho khác.
        </p>
      </section>

      <section className="blog-list">
        <div className="blog-card">
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c"
            alt="Gia dụng"
          />
          <h3>Mẹo chọn đồ gia dụng bền – đẹp – chuẩn giá</h3>
          <p>
            Hướng dẫn cách chọn các sản phẩm gia dụng phù hợp nhu cầu, bền bỉ và tiết
            kiệm chi phí cho gia đình.
          </p>
          <button className="blog-btn">Đọc thêm</button>
        </div>

        <div className="blog-card">
          <img
            src="https://images.unsplash.com/photo-1596464716127-7a7ab9150c5e"
            alt="Mỹ phẩm"
          />
          <h3>Mỹ phẩm chính hãng: Cách phân biệt thật – giả</h3>
          <p>
            Tụi mình chia sẻ các mẹo nhận biết mỹ phẩm chính hãng để bạn luôn an tâm
            khi sử dụng.
          </p>
          <button className="blog-btn">Đọc thêm</button>
        </div>

        <div className="blog-card">
          <img
            src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8"
            alt="Điện tử"
          />
          <h3>Hướng dẫn mua đồ điện tử chuẩn hàng tốt</h3>
          <p>
            Từ tai nghe, loa, đến máy cạo râu – đây là kinh nghiệm chọn đồ điện tử
            chính hãng với giá hợp lý.
          </p>
          <button className="blog-btn">Đọc thêm</button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
