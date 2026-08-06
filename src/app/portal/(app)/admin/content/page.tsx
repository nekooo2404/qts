import type { Metadata } from 'next'
import {
  BookOpenText,
  BriefcaseBusiness,
  LayoutTemplate,
  Plus,
  Settings2,
} from 'lucide-react'

import { BlogPostForm } from '@/components/portal/blog-post-form'
import {
  CaseStudyEditor,
  ServiceEditor,
  SiteSettingEditor,
} from '@/components/portal/content-editors'
import { PortalPageHeader } from '@/components/portal/portal-page-header'
import { StatusBadge } from '@/components/portal/status-badge'
import { requirePortalUser } from '@/lib/auth/guards'
import { hasPermission } from '@/lib/domain/permissions'
import { db } from '@/lib/db'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Quản lý nội dung' }

export default async function AdminContentPage() {
  const currentUser = await requirePortalUser()
  const canWrite = hasPermission(currentUser, 'admin.content.write')
  const [posts, services, caseStudies, settings] = await Promise.all([
    db.blogPost.findMany({
      include: { author: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
    }),
    db.service.findMany({ orderBy: { order: 'asc' } }),
    db.caseStudy.findMany({ orderBy: { updatedAt: 'desc' } }),
    db.siteSetting.findMany({ orderBy: { key: 'asc' } }),
  ])
  return (
    <div className="portal-page cms-page">
      <PortalPageHeader
        eyebrow="Website CMS"
        title="Quản lý nội dung"
        description="Biên tập blog, dịch vụ, case study và CTA công khai mà không cần page builder phức tạp."
      />
      <nav className="detail-tabs" aria-label="Nhóm nội dung">
        <a href="#blog">Blog</a>
        <a href="#services">Dịch vụ</a>
        <a href="#cases">Case study</a>
        <a href="#cta">CTA</a>
      </nav>
      <section className="portal-panel cms-section" id="blog">
        <header className="portal-panel__header">
          <div>
            <h2>Blog</h2>
            <p>{posts.length} bài viết ở mọi trạng thái.</p>
          </div>
          <BookOpenText size={18} />
        </header>
        {canWrite && (
          <details className="cms-editor cms-editor--create" id="create-blog">
            <summary>
              <Plus size={17} /> Tạo bài viết mới
            </summary>
            <BlogPostForm />
          </details>
        )}
        <div className="cms-record-list">
          {posts.map((post) => (
            <details className="cms-editor" key={post.id}>
              <summary>
                <span>
                  <strong>{post.title}</strong>
                  <small>
                    /{post.slug} · {post.author.name} ·{' '}
                    {formatDate(post.updatedAt)}
                  </small>
                </span>
                <StatusBadge status={post.status} />
              </summary>
              <BlogPostForm
                readOnly={!canWrite}
                postId={post.id}
                defaultValues={{
                  title: post.title,
                  slug: post.slug,
                  excerpt: post.excerpt,
                  content: post.content,
                  status: post.status,
                  metaTitle: post.metaTitle ?? '',
                  metaDescription: post.metaDescription ?? '',
                }}
              />
            </details>
          ))}
        </div>
      </section>
      <section className="portal-panel cms-section" id="services">
        <header className="portal-panel__header">
          <div>
            <h2>Dịch vụ</h2>
            <p>Nội dung nguồn cho nhóm trang dịch vụ.</p>
          </div>
          <Settings2 size={18} />
        </header>
        <div className="cms-record-list">
          {services.map((service) => (
            <details className="cms-editor" key={service.id}>
              <summary>
                <span>
                  <strong>{service.name}</strong>
                  <small>/{service.slug}</small>
                </span>
                <StatusBadge status={service.active ? 'ACTIVE' : 'CANCELLED'} />
              </summary>
              <ServiceEditor service={service} readOnly={!canWrite} />
            </details>
          ))}
        </div>
      </section>
      <section className="portal-panel cms-section" id="cases">
        <header className="portal-panel__header">
          <div>
            <h2>Case study</h2>
            <p>Dữ liệu demo cho dự án mẫu công khai.</p>
          </div>
          <BriefcaseBusiness size={18} />
        </header>
        <div className="cms-record-list">
          {caseStudies.map((item) => (
            <details className="cms-editor" key={item.id}>
              <summary>
                <span>
                  <strong>{item.title}</strong>
                  <small>
                    {item.industry} · /{item.slug}
                  </small>
                </span>
                <StatusBadge
                  status={item.publishedAt ? 'PUBLISHED' : 'DRAFT'}
                />
              </summary>
              <CaseStudyEditor
                readOnly={!canWrite}
                item={{
                  ...item,
                  publishedAt: item.publishedAt?.toISOString() ?? null,
                }}
              />
            </details>
          ))}
        </div>
      </section>
      <section className="portal-panel cms-section" id="cta">
        <header className="portal-panel__header">
          <div>
            <h2>CTA trang chủ</h2>
            <p>Thay đổi được phản ánh trên section cuối trang chủ.</p>
          </div>
          <LayoutTemplate size={18} />
        </header>
        <div className="cms-settings-grid">
          {settings.map((setting) => (
            <SiteSettingEditor
              setting={setting}
              key={setting.id}
              readOnly={!canWrite}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
