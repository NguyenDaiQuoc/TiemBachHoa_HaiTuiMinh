export type BlogCategory = 'buying-guide' | 'comparison' | 'tips' | 'how-to';

export interface BlogFaq {
  question: string;
  answer: string;
}

export interface BlogArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: BlogCategory;
  categoryLabel: string;
  publishedAt: string;
  readMinutes: number;
  heroImage: string;
  tags: string[];
  relatedProductQueries: string[];
  sections: { heading: string; body: string }[];
  faq: BlogFaq[];
}

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    slug: 'cach-chon-my-pham-chinh-hang-cho-da-nhay-cam',
    title: 'Cách chọn mỹ phẩm chính hãng cho da nhạy cảm',
    excerpt: 'Một checklist ngắn gọn để đọc nhãn, kiểm tra nguồn gốc và chọn sản phẩm phù hợp trước khi mua.',
    category: 'buying-guide',
    categoryLabel: 'Buying Guide',
    publishedAt: '2026-06-01',
    readMinutes: 6,
    heroImage: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=1600&auto=format&fit=crop',
    tags: ['Mỹ phẩm', 'Chính hãng', 'Da nhạy cảm'],
    relatedProductQueries: ['kem dưỡng', 'sữa rửa mặt', 'skincare'],
    sections: [
      { heading: 'Ưu tiên nguồn gốc rõ ràng', body: 'Sản phẩm nên có tem phụ, hạn dùng, mã lô và thông tin nhà phân phối. Với mỹ phẩm dùng trực tiếp lên da, nguồn gốc minh bạch quan trọng hơn mức giảm giá ngắn hạn.' },
      { heading: 'Đọc bảng thành phần theo nhu cầu da', body: 'Da nhạy cảm thường hợp công thức tối giản, có thành phần phục hồi như panthenol, ceramide hoặc madecassoside. Hạn chế chọn sản phẩm có quá nhiều hương liệu nếu da đang yếu.' },
      { heading: 'Mua theo quy trình chăm sóc, không mua theo trend', body: 'Một routine cơ bản gồm làm sạch, dưỡng ẩm và chống nắng thường hiệu quả hơn việc thêm quá nhiều hoạt chất cùng lúc.' },
    ],
    faq: [
      { question: 'Có nên test sản phẩm trước khi dùng toàn mặt không?', answer: 'Nên. Hãy thử ở vùng nhỏ trong 24-48 giờ, nhất là với sản phẩm mới hoặc da đang kích ứng.' },
      { question: 'Mỹ phẩm giảm giá sâu có đáng lo không?', answer: 'Không phải lúc nào cũng đáng lo, nhưng cần kiểm tra hạn dùng, niêm phong và nguồn cung trước khi mua.' },
    ],
  },
  {
    slug: 'so-sanh-loa-bluetooth-mini-va-loa-di-dong-cao-cap',
    title: 'So sánh loa Bluetooth mini và loa di động cao cấp',
    excerpt: 'Chọn loa theo không gian nghe, pin, độ bền và chất âm thay vì chỉ nhìn công suất.',
    category: 'comparison',
    categoryLabel: 'Comparison',
    publishedAt: '2026-05-28',
    readMinutes: 5,
    heroImage: 'https://images.unsplash.com/photo-1549463512-2051282a77bb?q=80&w=1600&auto=format&fit=crop',
    tags: ['Công nghệ', 'Âm thanh', 'So sánh'],
    relatedProductQueries: ['loa', 'bluetooth', 'sony'],
    sections: [
      { heading: 'Loa mini hợp nhu cầu linh hoạt', body: 'Nếu bạn thường nghe trong phòng nhỏ, mang đi làm hoặc đi du lịch, loa mini dễ dùng hơn nhờ kích thước gọn và thời lượng pin ổn.' },
      { heading: 'Loa cao cấp thắng ở độ phủ âm', body: 'Không gian lớn, nghe ngoài trời hoặc cần bass chắc hơn sẽ phù hợp loa di động cao cấp. Đổi lại, chi phí và trọng lượng thường cao hơn.' },
      { heading: 'Đừng bỏ qua chuẩn chống nước', body: 'Nếu hay dùng gần hồ bơi, nhà bếp hoặc ngoài trời, chuẩn IPX sẽ đáng tiền hơn các thông số quảng cáo khó kiểm chứng.' },
    ],
    faq: [
      { question: 'Công suất loa càng cao càng hay?', answer: 'Không hẳn. Công suất chỉ là một phần; thiết kế driver, tuning và không gian nghe mới quyết định trải nghiệm.' },
      { question: 'Loa mini có đủ dùng cho phòng ngủ không?', answer: 'Có, nếu phòng nhỏ và bạn không cần âm lượng quá lớn.' },
    ],
  },
  {
    slug: 'meo-bao-quan-do-gia-dung-thong-minh-ben-hon',
    title: 'Mẹo bảo quản đồ gia dụng thông minh bền hơn',
    excerpt: 'Các thói quen nhỏ giúp máy lọc không khí, máy pha cà phê và thiết bị bếp hoạt động ổn định hơn.',
    category: 'tips',
    categoryLabel: 'Tips & Tricks',
    publishedAt: '2026-05-20',
    readMinutes: 4,
    heroImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1600&auto=format&fit=crop',
    tags: ['Gia dụng', 'Bảo quản', 'Mẹo hay'],
    relatedProductQueries: ['máy lọc', 'máy pha cà phê', 'gia dụng'],
    sections: [
      { heading: 'Vệ sinh theo chu kỳ cố định', body: 'Thiết bị gia dụng thường xuống hiệu năng vì bụi, cặn nước hoặc dầu mỡ. Đặt lịch vệ sinh định kỳ giúp thiết bị bền và dùng an toàn hơn.' },
      { heading: 'Dùng đúng phụ kiện thay thế', body: 'Màng lọc, lõi lọc hoặc gioăng cao su nên dùng đúng chuẩn. Phụ kiện sai kích thước có thể làm giảm hiệu quả hoặc gây lỗi máy.' },
      { heading: 'Cất ở nơi khô thoáng', body: 'Độ ẩm cao làm giảm tuổi thọ mạch điện và gây mùi. Với thiết bị ít dùng, hãy lau khô trước khi cất.' },
    ],
    faq: [
      { question: 'Bao lâu nên thay màng lọc?', answer: 'Tùy thiết bị và môi trường. Nhà nhiều bụi hoặc nuôi thú cưng thường cần thay sớm hơn khuyến nghị chuẩn.' },
      { question: 'Có nên dùng ổ cắm riêng?', answer: 'Nên với thiết bị công suất cao để ổn định điện và giảm rủi ro quá tải.' },
    ],
  },
  {
    slug: 'huong-dan-kiem-tra-san-pham-khi-nhan-hang',
    title: 'Hướng dẫn kiểm tra sản phẩm khi nhận hàng',
    excerpt: 'Quy trình 3 phút giúp bạn kiểm tra niêm phong, ngoại quan và phụ kiện trước khi xác nhận đơn.',
    category: 'how-to',
    categoryLabel: 'How-to',
    publishedAt: '2026-05-12',
    readMinutes: 3,
    heroImage: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?q=80&w=1600&auto=format&fit=crop',
    tags: ['Mua hàng', 'Kiểm hàng', 'Đổi trả'],
    relatedProductQueries: ['chính hãng', 'bảo hành'],
    sections: [
      { heading: 'Quay video mở hộp', body: 'Video mở hộp là bằng chứng rõ nhất nếu sản phẩm thiếu phụ kiện, móp méo hoặc sai mẫu. Hãy quay từ lúc còn nguyên kiện.' },
      { heading: 'Đối chiếu mã đơn và sản phẩm', body: 'Kiểm tra tên sản phẩm, phân loại, số lượng, tình trạng niêm phong và phụ kiện đi kèm trước khi sử dụng.' },
      { heading: 'Liên hệ ngay nếu có vấn đề', body: 'Nếu phát hiện lỗi, giữ nguyên bao bì và gửi hình ảnh hoặc video cho cửa hàng để được xử lý nhanh hơn.' },
    ],
    faq: [
      { question: 'Đã bóc seal có đổi trả được không?', answer: 'Tùy nhóm hàng và lỗi phát sinh. Mỹ phẩm đã bóc seal thường khó đổi nếu không có lỗi từ nhà sản xuất.' },
      { question: 'Cần giữ hộp bao lâu?', answer: 'Nên giữ hộp ít nhất trong thời gian đổi trả để việc xác minh thuận lợi.' },
    ],
  },
];

export const getArticleBySlug = (slug?: string) => BLOG_ARTICLES.find((article) => article.slug === slug);

export const getRelatedArticles = (article: BlogArticle, limit = 3) =>
  BLOG_ARTICLES.filter((entry) => entry.slug !== article.slug && (entry.category === article.category || entry.tags.some((tag) => article.tags.includes(tag)))).slice(0, limit);
