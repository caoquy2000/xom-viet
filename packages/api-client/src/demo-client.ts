import type {
  CommunityApi,
  Post,
  Comment,
  User,
  FeedQuery,
  CreatePostInput,
  VoteValue,
  Topic,
} from "./types";

export const TOPICS: Topic[] = [
  {
    slug: "hai-huoc",
    name: "Hài hước",
    emoji: "😂",
    description: "Một chiếc meme, một ngày vui.",
  },
  {
    slug: "thu-cung",
    name: "Thú cưng",
    emoji: "🐈",
    description: "Hội những người bị boss thao túng.",
  },
  {
    slug: "doi-song",
    name: "Đời sống",
    emoji: "☕",
    description: "Chuyện nhỏ mỗi ngày, kể cả xóm nghe.",
  },
  {
    slug: "gaming",
    name: "Gaming",
    emoji: "🎮",
    description: "Thắng thì gáy, thua thì… mạng lag.",
  },
  {
    slug: "cong-nghe",
    name: "Công nghệ",
    emoji: "💻",
    description: "Code, đồ công nghệ và những cú crash.",
  },
  {
    slug: "am-thuc",
    name: "Ẩm thực",
    emoji: "🍜",
    description: "Đói thì vào, no rồi vẫn vào.",
  },
];
const PEOPLE: User[] = [
  { id: "u1", name: "Mèo Không Ngủ", username: "meokhongngu", avatar: "🐱" },
  { id: "u2", name: "Một Chút Chill", username: "motchutchill", avatar: "🥑" },
  { id: "u3", name: "Cà Phê Sữa Đá", username: "caphe_suada", avatar: "☕" },
  { id: "u4", name: "Dev Hướng Nội", username: "devhuongnoi", avatar: "👨‍💻" },
];
const DEMO_USER: User = {
  id: "demo",
  name: "Người trong xóm",
  username: "hangxom",
  avatar: "😎",
};
export function createDemoApi(): CommunityApi {
  const now = Date.now();
  const entries = [
    {
      title: "Tôi lúc 8:59 khi công ty chấm công lúc 9:00",
      topicSlug: "hai-huoc",
      imageUrl: "/images/cat.jpg",
      score: 2486,
      commentCount: 128,
      author: PEOPLE[0],
      tags: ["dilam", "chuyencongso"],
      body: "",
    },
    {
      title: "Mục tiêu năm nay: bình thản được như anh bạn này 🫠",
      topicSlug: "thu-cung",
      imageUrl: "/images/capybara.jpg",
      score: 1862,
      commentCount: 76,
      author: PEOPLE[1],
      tags: ["capybara", "chill"],
      body: "",
    },
    {
      title: "Có những thứ chỉ cần nhìn là thấy nhớ nhà",
      topicSlug: "doi-song",
      imageUrl: "/images/street.jpg",
      score: 1204,
      commentCount: 54,
      author: PEOPLE[2],
      tags: ["vietnam", "chuyenmoingay"],
      body: "",
    },
    {
      title: "“Sửa một dòng thôi mà, chắc 5 phút là xong.”",
      topicSlug: "cong-nghe",
      imageUrl: null,
      score: 983,
      commentCount: 42,
      author: PEOPLE[3],
      tags: ["laptrinh", "deadline"],
      body: "5 phút sau: lỗi mới.\n1 giờ sau: 12 tab Stack Overflow.\n3 giờ sau: hóa ra thiếu dấu chấm phẩy.\n\nNgày làm việc bình thường của một lập trình viên 🙂",
    },
    {
      title: "Đang combat thì mẹ gọi ăn cơm. Anh em chọn bên nào?",
      topicSlug: "gaming",
      imageUrl: null,
      score: 752,
      commentCount: 31,
      author: PEOPLE[3],
      tags: ["gaming", "tuoitho"],
      body: "Team đang cần mình.\nNhưng mẹ chỉ gọi lần thứ hai thôi… 🎮🍚",
    },
    {
      title: "Hạnh phúc đơn giản là tìm được quán ruột mở cửa sau 10 giờ",
      topicSlug: "am-thuc",
      imageUrl: "/images/street.jpg",
      score: 641,
      commentCount: 22,
      author: PEOPLE[2],
      tags: ["anvat", "doibung"],
      body: "",
    },
  ];
  let posts: Post[] = entries.map((p, i) => ({
    ...p,
    id: `demo-${i + 1}`,
    createdAt: new Date(now - (i + 1) * 3600000).toISOString(),
    viewerVote: 0,
    saved: false,
  }));
  let user: User | null = null;
  const threads = new Map<string, Comment[]>();
  const get = (id: string) => {
    const post = posts.find((p) => p.id === id);
    if (!post) throw new Error("Không tìm thấy bài viết.");
    return post;
  };
  const requireUser = () => {
    if (!user) throw new Error("Bạn đăng nhập để tham gia nhé.");
    return user;
  };
  const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
  const localId = () =>
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return {
    mode: "demo",
    async topics() {
      return clone(TOPICS);
    },
    async feed(query: FeedQuery = {}) {
      let list = posts.filter(
        (p) =>
          (!query.topic || p.topicSlug === query.topic) &&
          (!query.saved || p.saved),
      );
      if (query.query) {
        const q = query.query.toLocaleLowerCase("vi");
        list = list.filter((p) =>
          `${p.title} ${p.body} ${p.tags.join(" ")}`
            .toLocaleLowerCase("vi")
            .includes(q),
        );
      }
      if (query.period && query.period !== "all") {
        const cutoff =
          Date.now() - (query.period === "week" ? 7 : 1) * 86400000;
        list = list.filter((p) => Date.parse(p.createdAt) >= cutoff);
      }
      list = [...list].sort(
        query.sort === "new"
          ? (a, b) =>
              b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)
          : (a, b) => b.score - a.score || b.id.localeCompare(a.id),
      );
      const offset = Number(query.cursor || 0);
      const end = offset + 6;
      return {
        data: clone(list.slice(offset, end)),
        nextCursor: list.length > end ? String(end) : null,
      };
    },
    async post(id) {
      return clone(get(id));
    },
    async createPost(input: CreatePostInput) {
      const author = requireUser();
      if (input.title.trim().length < 3 || input.title.trim().length > 200)
        throw new Error("Tiêu đề cần từ 3 đến 200 ký tự.");
      if (!TOPICS.some((t) => t.slug === input.topicSlug))
        throw new Error("Chọn một chủ đề hợp lệ.");
      let imageUrl = input.imageUrl || null;
      if (input.image) {
        imageUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(input.image!);
        });
      }
      const post: Post = {
        id: `local-${localId()}`,
        title: input.title.trim(),
        body: input.body || "",
        imageUrl,
        topicSlug: input.topicSlug,
        author,
        createdAt: new Date().toISOString(),
        score: 0,
        commentCount: 0,
        viewerVote: 0,
        saved: false,
        tags: [],
      };
      posts.unshift(post);
      return clone(post);
    },
    async vote(id: string, value: VoteValue) {
      requireUser();
      if (![-1, 0, 1].includes(value))
        throw new Error("Bình chọn không hợp lệ.");
      const p = get(id);
      p.score += value - p.viewerVote;
      p.viewerVote = value;
      return clone(p);
    },
    async save(id: string, saved: boolean) {
      requireUser();
      const p = get(id);
      p.saved = saved;
      return clone(p);
    },
    async comments(id: string) {
      get(id);
      if (!threads.has(id))
        threads.set(
          id,
          id.startsWith("local-")
            ? []
            : [
                {
                  id: `${id}-c1`,
                  body: "Sao giống mình quá vậy 😂",
                  author: PEOPLE[2],
                  createdAt: new Date(now - 1800000).toISOString(),
                },
                {
                  id: `${id}-c2`,
                  body: "Lướt xóm một chút mà hết cả giờ nghỉ trưa.",
                  author: PEOPLE[3],
                  createdAt: new Date(now - 900000).toISOString(),
                },
              ],
        );
      return clone(threads.get(id)!);
    },
    async comment(id: string, body: string) {
      const author = requireUser();
      if (!body.trim() || body.length > 2000)
        throw new Error("Bình luận cần từ 1 đến 2.000 ký tự.");
      const current = await this.comments(id);
      const c = {
        id: localId(),
        body: body.trim(),
        author,
        createdAt: new Date().toISOString(),
      };
      threads.set(id, [...current, c]);
      get(id).commentCount++;
      return clone(c);
    },
    async report(id: string, reason: string) {
      requireUser();
      get(id);
      if (!reason.trim()) throw new Error("Vui lòng chọn lý do.");
    },
    async signIn() {
      user = DEMO_USER;
      return clone(user);
    },
    async signUp() {
      user = DEMO_USER;
      return clone(user);
    },
    async signOut() {
      user = null;
    },
    async currentUser() {
      return clone(user);
    },
  };
}
