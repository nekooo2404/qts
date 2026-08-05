export type MarketingLink = {
  label: string
  href: string
  description?: string
}

export type MenuGroup = {
  title: string
  links: MarketingLink[]
}

export const publicNavigation: Array<{
  label: string
  href?: string
  groups?: MenuGroup[]
}> = [
  {
    label: 'Hệ sinh thái',
    href: '/san-pham',
    groups: [
      {
        title: 'Nền tảng vận hành',
        links: [
          {
            label: 'QTS Portal',
            href: '/san-pham/qts-portal',
            description: 'Kết nối dự án, hỗ trợ và tài liệu.',
          },
          {
            label: 'QTS Work · Định hướng',
            href: '/san-pham/qts-work',
            description: 'Mẫu định hướng cho quản lý công việc theo quy trình.',
          },
          {
            label: 'QTS CRM · Định hướng',
            href: '/san-pham/qts-crm',
            description: 'Mẫu định hướng cho quản lý khách hàng.',
          },
        ],
      },
      {
        title: 'Thiết kế & phát triển',
        links: [
          {
            label: 'Thiết kế website',
            href: '/dich-vu/thiet-ke-website',
            description:
              'Cấu trúc nội dung và giao diện theo hành trình sử dụng.',
          },
          {
            label: 'Phần mềm theo yêu cầu',
            href: '/dich-vu/phat-trien-phan-mem',
            description: 'Mô hình hóa quy trình, vai trò và dữ liệu nghiệp vụ.',
          },
        ],
      },
      {
        title: 'Dữ liệu & hạ tầng',
        links: [
          {
            label: 'Tích hợp hệ thống',
            href: '/dich-vu/tich-hop-he-thong',
            description: 'Kết nối API và đồng bộ dữ liệu có kiểm soát.',
          },
          {
            label: 'Dashboard quản trị',
            href: '/giai-phap/doanh-nghiep',
            description: 'Tổng hợp chỉ số theo vai trò và nguồn dữ liệu.',
          },
          {
            label: 'Bảo trì & vận hành',
            href: '/dich-vu/bao-tri-van-hanh',
            description: 'Theo dõi yêu cầu và cải tiến sau bàn giao.',
          },
        ],
      },
    ],
  },
  {
    label: 'Giải pháp',
    href: '/giai-phap',
    groups: [
      {
        title: 'Theo lĩnh vực',
        links: [
          { label: 'Doanh nghiệp', href: '/giai-phap/doanh-nghiep' },
          { label: 'Giáo dục', href: '/giai-phap/giao-duc' },
          { label: 'Thương mại', href: '/giai-phap/thuong-mai' },
          { label: 'Cơ quan, tổ chức', href: '/giai-phap/co-quan-to-chuc' },
        ],
      },
      {
        title: 'Theo nhu cầu',
        links: [
          { label: 'Vận hành doanh nghiệp', href: '/giai-phap/doanh-nghiep' },
          { label: 'Giải pháp theo yêu cầu', href: '/bao-gia' },
        ],
      },
    ],
  },
  { label: 'Dự án', href: '/du-an' },
  {
    label: 'Kiến thức',
    href: '/blog',
    groups: [
      {
        title: 'Tài nguyên',
        links: [
          { label: 'Blog công nghệ', href: '/blog' },
          { label: 'Case study', href: '/du-an' },
          { label: 'Câu hỏi thường gặp', href: '/#faq' },
        ],
      },
    ],
  },
  {
    label: 'Hỗ trợ',
    href: '/lien-he',
    groups: [
      {
        title: 'Làm việc cùng QTS',
        links: [
          {
            label: 'Liên hệ tư vấn',
            href: '/lien-he',
            description: 'Trao đổi nhu cầu và bối cảnh vận hành hiện tại.',
          },
          {
            label: 'Yêu cầu báo giá',
            href: '/bao-gia',
            description: 'Cung cấp phạm vi để nhận đề xuất phù hợp.',
          },
          {
            label: 'QTS Portal',
            href: '/portal/login',
            description: 'Theo dõi dự án, ticket, tài liệu và thông báo.',
          },
        ],
      },
    ],
  },
  {
    label: 'Công ty',
    href: '/gioi-thieu',
    groups: [
      {
        title: 'QTS Technology',
        links: [
          { label: 'Giới thiệu', href: '/gioi-thieu' },
          { label: 'Khách hàng', href: '/khach-hang' },
          { label: 'Tuyển dụng', href: '/tuyen-dung' },
          { label: 'Liên hệ', href: '/lien-he' },
        ],
      },
    ],
  },
  { label: 'Báo giá', href: '/bao-gia' },
]

export const serviceDetails = {
  'thiet-ke-website': {
    name: 'Thiết kế website doanh nghiệp',
    shortName: 'Thiết kế website',
    description:
      'Thiết kế trải nghiệm số rõ ràng, nhanh và dễ quản trị, bám sát hành trình của khách hàng và đội ngũ nội bộ.',
    benefits: [
      'Cấu trúc nội dung theo mục tiêu kinh doanh',
      'Thiết kế responsive và dễ tiếp cận',
      'Nền tảng quản trị có thể mở rộng',
    ],
    deliverables: [
      'Khảo sát nội dung',
      'Thiết kế UI/UX',
      'Phát triển và bàn giao',
    ],
    icon: 'LayoutTemplate',
  },
  'phat-trien-phan-mem': {
    name: 'Phát triển phần mềm theo yêu cầu',
    shortName: 'Phần mềm theo yêu cầu',
    description:
      'Chuyển quy trình vận hành thành hệ thống có vai trò, dữ liệu và trạng thái rõ ràng theo từng giai đoạn.',
    benefits: [
      'Phân tích nghiệp vụ trước khi phát triển',
      'Kiến trúc module có khả năng mở rộng',
      'Kiểm thử và bàn giao theo mốc',
    ],
    deliverables: [
      'Phân tích nghiệp vụ',
      'Thiết kế hệ thống',
      'Phát triển, kiểm thử',
    ],
    icon: 'Blocks',
  },
  'tich-hop-he-thong': {
    name: 'Tích hợp hệ thống và API',
    shortName: 'Tích hợp hệ thống',
    description:
      'Kết nối các nguồn dữ liệu và phần mềm đang vận hành bằng luồng tích hợp có kiểm soát và khả năng quan sát.',
    benefits: [
      'Giảm nhập liệu lặp lại',
      'Quy tắc đồng bộ có thể kiểm tra',
      'Theo dõi lỗi và khôi phục rõ ràng',
    ],
    deliverables: ['Đánh giá hệ thống', 'Thiết kế API', 'Đồng bộ và giám sát'],
    icon: 'Waypoints',
  },
  'bao-tri-van-hanh': {
    name: 'Bảo trì và vận hành hệ thống',
    shortName: 'Bảo trì & vận hành',
    description:
      'Theo dõi, xử lý yêu cầu và cải tiến hệ thống theo kế hoạch hỗ trợ được hai bên thống nhất.',
    benefits: [
      'Đầu mối hỗ trợ tập trung',
      'Lịch sử yêu cầu minh bạch',
      'Cải tiến theo dữ liệu vận hành',
    ],
    deliverables: [
      'Tiếp nhận hệ thống',
      'Theo dõi vận hành',
      'Báo cáo và cải tiến',
    ],
    icon: 'LifeBuoy',
  },
} as const

export const ecosystemItems = [
  serviceDetails['thiet-ke-website'],
  serviceDetails['phat-trien-phan-mem'],
  {
    name: 'QTS Portal',
    shortName: 'QTS Portal',
    description:
      'Một điểm làm việc chung cho dự án, ticket, tài liệu, hợp đồng và thông báo.',
    benefits: [
      'Theo dõi tiến độ',
      'Trao đổi tập trung',
      'Dữ liệu theo vai trò',
    ],
    deliverables: ['Portal khách hàng'],
    icon: 'PanelsTopLeft',
  },
  serviceDetails['tich-hop-he-thong'],
  {
    name: 'Data Dashboard',
    shortName: 'Data Dashboard',
    description:
      'Tập hợp chỉ số vận hành quan trọng thành góc nhìn dễ theo dõi và ra quyết định.',
    benefits: [
      'Chỉ số có nguồn',
      'Bộ lọc theo vai trò',
      'Cảnh báo theo ngưỡng',
    ],
    deliverables: ['Dashboard quản trị'],
    icon: 'ChartNoAxesCombined',
  },
  serviceDetails['bao-tri-van-hanh'],
] as const

export const platformGroups = [
  {
    id: 'work-platforms',
    title: 'Nền tảng làm việc',
    description:
      'Kết hợp bề mặt Portal đang hoạt động với các hướng sản phẩm được ghi rõ trạng thái.',
    href: '/san-pham',
    products: [
      {
        name: 'QTS Portal',
        description: 'Dự án, ticket, tài liệu và thông báo.',
        href: '/san-pham/qts-portal',
        icon: 'PanelsTopLeft',
        status: 'Bản demo hoạt động',
      },
      {
        name: 'QTS Work',
        description: 'Công việc, deadline và người phụ trách.',
        href: '/san-pham/qts-work',
        icon: 'GitPullRequestArrow',
        status: 'Mẫu định hướng',
      },
      {
        name: 'QTS CRM',
        description: 'Khách hàng, cơ hội và lịch sử tương tác.',
        href: '/san-pham/qts-crm',
        icon: 'Network',
        status: 'Mẫu định hướng',
      },
    ],
  },
  {
    id: 'digital-experience',
    title: 'Trải nghiệm số',
    description:
      'Thiết kế bề mặt số rõ nội dung, đúng hành trình và dễ quản trị.',
    href: '/dich-vu',
    products: [
      {
        name: 'Website doanh nghiệp',
        description: 'Nội dung, giao diện và hệ quản trị.',
        href: '/dich-vu/thiet-ke-website',
        icon: 'LayoutTemplate',
      },
      {
        name: 'Phần mềm theo yêu cầu',
        description: 'Quy trình nghiệp vụ được mô hình hóa.',
        href: '/dich-vu/phat-trien-phan-mem',
        icon: 'Blocks',
      },
    ],
  },
  {
    id: 'data-integration',
    title: 'Dữ liệu & tích hợp',
    description:
      'Kết nối nguồn dữ liệu, hệ thống và báo cáo bằng hợp đồng rõ ràng.',
    href: '/dich-vu/tich-hop-he-thong',
    products: [
      {
        name: 'Tích hợp API',
        description: 'Đồng bộ có quy tắc và lịch sử lỗi.',
        href: '/dich-vu/tich-hop-he-thong',
        icon: 'Waypoints',
      },
      {
        name: 'Dashboard quản trị',
        description: 'Chỉ số theo vai trò và nguồn dữ liệu.',
        href: '/giai-phap/doanh-nghiep',
        icon: 'ChartNoAxesCombined',
      },
    ],
  },
  {
    id: 'operations-support',
    title: 'Vận hành & hỗ trợ',
    description:
      'Theo dõi hệ thống sau bàn giao bằng một kênh phối hợp thống nhất.',
    href: '/dich-vu/bao-tri-van-hanh',
    products: [
      {
        name: 'Bảo trì hệ thống',
        description: 'Theo dõi thay đổi và ưu tiên cải tiến.',
        href: '/dich-vu/bao-tri-van-hanh',
        icon: 'LifeBuoy',
      },
      {
        name: 'Trung tâm yêu cầu',
        description: 'Ticket có trạng thái và lịch sử trao đổi.',
        href: '/san-pham/qts-portal',
        icon: 'FileText',
      },
    ],
  },
  {
    id: 'industry-solutions',
    title: 'Giải pháp theo lĩnh vực',
    description:
      'Điểm bắt đầu khác nhau cho từng bối cảnh tổ chức và người dùng.',
    href: '/giai-phap',
    products: [
      {
        name: 'Doanh nghiệp',
        description: 'Điều hành, quy trình và báo cáo.',
        href: '/giai-phap/doanh-nghiep',
        icon: 'ScanSearch',
      },
      {
        name: 'Giáo dục',
        description: 'Cổng thông tin và quản trị nội dung.',
        href: '/giai-phap/giao-duc',
        icon: 'LayoutTemplate',
      },
      {
        name: 'Thương mại',
        description: 'Trải nghiệm mua hàng và dữ liệu đơn hàng.',
        href: '/giai-phap/thuong-mai',
        icon: 'ChartNoAxesCombined',
      },
      {
        name: 'Cơ quan, tổ chức',
        description: 'Phê duyệt, phân quyền và tài liệu.',
        href: '/giai-phap/co-quan-to-chuc',
        icon: 'ShieldCheck',
      },
    ],
  },
] as const

export const platformPrinciples = [
  'Phân quyền theo vai trò',
  'Tiến độ theo milestone',
  'Ticket có lịch sử',
  'Tài liệu tập trung',
  'API có hợp đồng',
  'Dữ liệu demo được ghi rõ',
] as const

export const platformFacts = [
  {
    target: 3,
    prefix: '',
    suffix: '',
    label: 'Vai trò truy cập',
    note: 'ADMIN · STAFF · CUSTOMER',
  },
  {
    target: 8,
    prefix: '',
    suffix: '',
    label: 'Nhóm nghiệp vụ',
    note: 'Trong QTS Portal demo',
  },
  {
    target: 6,
    prefix: '',
    suffix: '',
    label: 'Giai đoạn triển khai',
    note: 'Từ nhu cầu đến vận hành',
  },
  {
    target: 1,
    prefix: '',
    suffix: '',
    label: 'Không gian phối hợp',
    note: 'Dự án · hỗ trợ · tài liệu',
  },
] as const

export const homeFaqs = [
  {
    question: 'QTS phù hợp với doanh nghiệp ở giai đoạn nào?',
    answer:
      'QTS bắt đầu từ bài toán và quy trình hiện tại. Phạm vi có thể là một website, một luồng nghiệp vụ riêng hoặc cổng phối hợp nhiều bộ phận; quy mô chỉ được chốt sau bước khảo sát.',
  },
  {
    question: 'Chi phí triển khai được xác định như thế nào?',
    answer:
      'Chi phí phụ thuộc phạm vi chức năng, mức tích hợp, dữ liệu cần chuyển đổi và yêu cầu vận hành. Trang báo giá thu thập các thông tin này để QTS phản hồi bằng đề xuất có phạm vi rõ ràng.',
  },
  {
    question: 'Có thể tích hợp với hệ thống đang sử dụng không?',
    answer:
      'Có thể khi hệ thống nguồn cung cấp API hoặc cơ chế trao đổi dữ liệu phù hợp. QTS sẽ đánh giá hợp đồng dữ liệu, quyền truy cập, tần suất đồng bộ và phương án khôi phục trước khi triển khai.',
  },
  {
    question: 'Khách hàng theo dõi tiến độ và yêu cầu hỗ trợ ở đâu?',
    answer:
      'QTS Portal tập trung milestone, công việc, ticket, tài liệu, hợp đồng và thông báo theo quyền của từng tài khoản.',
  },
  {
    question:
      'Dữ liệu trên website demo có phải số liệu doanh nghiệp thật không?',
    answer:
      'Không. Mọi tên khách hàng, case study và chỉ số chưa được xác nhận đều được đánh dấu là dữ liệu demo hoặc placeholder; chúng phải được thay trước khi xuất bản chính thức.',
  },
] as const

export const productDetails = {
  'qts-portal': {
    name: 'QTS Portal',
    eyebrow: 'Cổng thông tin doanh nghiệp',
    description:
      'Kết nối đội ngũ QTS và khách hàng trong một không gian có phân quyền, lịch sử và dữ liệu vận hành rõ ràng.',
    features: [
      'Quản lý dự án và milestone',
      'Ticket hỗ trợ có lịch sử trao đổi',
      'Tài liệu, hợp đồng và hóa đơn',
      'Thông báo tập trung theo vai trò',
    ],
    status: 'Bản demo hoạt động',
  },
  'qts-crm': {
    name: 'QTS CRM',
    eyebrow: 'Sản phẩm mẫu',
    description:
      'Khái niệm sản phẩm cho quy trình quản lý khách hàng, cơ hội và lịch sử tương tác theo nhu cầu riêng.',
    features: [
      'Hồ sơ khách hàng tập trung',
      'Luồng cơ hội có trạng thái',
      'Nhắc việc và lịch sử tương tác',
      'Báo cáo theo dữ liệu được xác nhận',
    ],
    status: 'Mẫu định hướng sản phẩm',
  },
  'qts-work': {
    name: 'QTS Work',
    eyebrow: 'Quản lý công việc',
    description:
      'Không gian điều phối công việc theo nhóm, deadline, mức ưu tiên và tiến độ có thể quan sát.',
    features: [
      'Kanban và danh sách',
      'Người phụ trách và deadline',
      'Bình luận theo công việc',
      'Tổng hợp tiến độ theo dự án',
    ],
    status: 'Mẫu định hướng sản phẩm',
  },
} as const

export const solutionDetails = {
  'doanh-nghiep': {
    name: 'Giải pháp cho doanh nghiệp',
    description:
      'Chuẩn hóa luồng vận hành, kết nối dữ liệu và tạo góc nhìn quản trị phù hợp với từng vai trò.',
    needs: [
      'Điều hành tập trung',
      'Số hóa quy trình',
      'Báo cáo có nguồn dữ liệu',
    ],
  },
  'giao-duc': {
    name: 'Giải pháp cho giáo dục',
    description:
      'Tổ chức nội dung, dịch vụ trực tuyến và dữ liệu quản trị trên một nền tảng dễ sử dụng.',
    needs: [
      'Cổng thông tin',
      'Quản trị nội dung',
      'Kết nối hệ thống nghiệp vụ',
    ],
  },
  'thuong-mai': {
    name: 'Giải pháp cho thương mại và bán lẻ',
    description:
      'Kết nối trải nghiệm mua hàng, vận hành đơn hàng và dữ liệu phục vụ theo dõi kinh doanh.',
    needs: ['Website thương mại', 'Quản lý đơn hàng', 'Tích hợp dữ liệu'],
  },
  'co-quan-to-chuc': {
    name: 'Giải pháp cho cơ quan và tổ chức',
    description:
      'Xây dựng cổng thông tin và quy trình xử lý có phân quyền, lịch sử và tiêu chí bảo mật rõ ràng.',
    needs: ['Cổng thông tin', 'Quy trình phê duyệt', 'Quản lý tài liệu'],
  },
} as const

export const solutionTabs = [
  {
    id: 'operations',
    label: 'Quản trị và điều hành',
    title: 'Một góc nhìn vận hành theo đúng vai trò',
    description:
      'Kết nối dự án, công việc và chỉ số quan trọng để người phụ trách biết việc gì cần hành động.',
    features: [
      'Dashboard theo vai trò',
      'Luồng phê duyệt',
      'Thông báo tập trung',
    ],
    accent: '58%',
  },
  {
    id: 'commerce',
    label: 'Website và thương mại',
    title: 'Trải nghiệm nhất quán từ nội dung đến đơn hàng',
    description:
      'Thiết kế hành trình rõ ràng và kết nối phần giao diện với hệ thống quản trị phía sau.',
    features: ['Nội dung dễ tìm', 'Tối ưu chuyển đổi', 'Quản trị tập trung'],
    accent: '72%',
  },
  {
    id: 'software',
    label: 'Phần mềm nghiệp vụ',
    title: 'Phần mềm phản ánh quy trình thực tế',
    description:
      'Mô hình hóa vai trò, trạng thái, dữ liệu và ngoại lệ trước khi mở rộng chức năng.',
    features: [
      'Phân tích nghiệp vụ',
      'Kiến trúc module',
      'Kiểm thử theo luồng',
    ],
    accent: '64%',
  },
  {
    id: 'data',
    label: 'Dữ liệu và tích hợp',
    title: 'Dữ liệu liền mạch, nguồn gốc có thể kiểm tra',
    description:
      'Đồng bộ có quy tắc, theo dõi lỗi và trình bày chỉ số từ nguồn dữ liệu được xác nhận.',
    features: ['API có hợp đồng', 'Theo dõi đồng bộ', 'Dashboard có nguồn'],
    accent: '81%',
  },
  {
    id: 'operations-support',
    label: 'Hạ tầng và vận hành',
    title: 'Theo dõi hệ thống sau khi bàn giao',
    description:
      'Tập trung yêu cầu, lịch sử xử lý và kế hoạch cải tiến trên một kênh phối hợp rõ ràng.',
    features: ['Ticket hỗ trợ', 'Theo dõi thay đổi', 'Báo cáo vận hành'],
    accent: '69%',
  },
] as const

export const implementationProcess = [
  ['01', 'Tiếp nhận nhu cầu', 'Làm rõ mục tiêu, người dùng và ràng buộc.'],
  ['02', 'Phân tích nghiệp vụ', 'Mô hình hóa dữ liệu, vai trò và luồng xử lý.'],
  [
    '03',
    'Thiết kế UI/UX',
    'Kiểm chứng cấu trúc và trải nghiệm trước khi phát triển.',
  ],
  [
    '04',
    'Phát triển và kiểm thử',
    'Bàn giao theo lát cắt có tiêu chí nghiệm thu.',
  ],
  [
    '05',
    'Triển khai hệ thống',
    'Chuẩn bị dữ liệu, tài liệu và kế hoạch chuyển đổi.',
  ],
  [
    '06',
    'Bảo trì và cải tiến',
    'Theo dõi yêu cầu và ưu tiên cải tiến sau bàn giao.',
  ],
] as const

export const qtsAdvantages = [
  [
    'ScanSearch',
    'Giải pháp sát với nghiệp vụ',
    'Bắt đầu từ quy trình và điểm nghẽn có thể kiểm chứng.',
  ],
  [
    'Network',
    'Kiến trúc có khả năng mở rộng',
    'Tách module và hợp đồng dữ liệu để giảm phụ thuộc.',
  ],
  [
    'MousePointer2',
    'Giao diện dễ sử dụng',
    'Ưu tiên tác vụ thường xuyên, ngôn ngữ rõ ràng và phản hồi trạng thái.',
  ],
  [
    'GitPullRequestArrow',
    'Quy trình phát triển minh bạch',
    'Tiến độ, quyết định và tiêu chí nghiệm thu được theo dõi theo mốc.',
  ],
  [
    'ShieldCheck',
    'Bảo mật ngay từ thiết kế',
    'Phân quyền, xác thực và ranh giới dữ liệu được kiểm tra ở server.',
  ],
  [
    'LifeBuoy',
    'Đồng hành sau triển khai',
    'Ticket, tài liệu và lịch sử hỗ trợ nằm trong cùng một cổng thông tin.',
  ],
] as const

export const placeholderStats = [
  {
    target: 24,
    prefix: '[',
    suffix: '+]',
    label: 'Dự án mẫu',
    note: 'Dữ liệu minh họa',
  },
  {
    target: 18,
    prefix: '[',
    suffix: '+]',
    label: 'Khách hàng mẫu',
    note: 'Dữ liệu minh họa',
  },
  {
    target: 42,
    prefix: '[',
    suffix: '+]',
    label: 'Module phần mềm',
    note: 'Dữ liệu minh họa',
  },
  {
    target: 96,
    prefix: '[',
    suffix: '+]',
    label: 'Yêu cầu hỗ trợ',
    note: 'Dữ liệu minh họa',
  },
] as const

export const customerPlaceholders = [
  '[Khách hàng mẫu 01]',
  '[Khách hàng mẫu 02]',
  '[Tổ chức mẫu 03]',
  '[Doanh nghiệp mẫu 04]',
  '[Đơn vị mẫu 05]',
  '[Khách hàng mẫu 06]',
] as const

export const portalCapabilities = [
  'Quản lý dự án',
  'Quản lý yêu cầu hỗ trợ',
  'Theo dõi tiến độ',
  'Chia sẻ tài liệu',
  'Quản lý hợp đồng',
  'Tra cứu hóa đơn',
  'Thông báo tập trung',
  'Báo cáo tổng quan',
] as const
