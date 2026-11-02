import { prisma, queryAll, bool, nullIfEmpty } from '../db';
import { idMap } from '../id-map';
import { report } from '../report';
import { resolveMediaPath } from '../media-path';

interface BlogAuthorRow {
  id: number;
  name: string;
  salutation: string | null;
  email: string;
  description: string | null;
  status: number;
}

interface BlogRow {
  id: number;
  title: string;
  abstract: string | null;
  content: string;
  blog_date: Date | null;
  publish_status: number;
}

interface StoryAuthorRow {
  id: number;
  name: string;
  salutation: string | null;
  email: string;
  description: string | null;
  status: number;
}

interface StoryRow {
  id: number;
  title: string;
  abstract: string | null;
  content: string;
  story_date: Date | null;
  publish_status: number;
}

interface TeamMemberRow {
  id: number;
  position: string;
  position_order: number;
  salutation: string | null;
  full_name: string;
  country_code: string;
  country_name: string;
  member_address: string;
  member_phone: string | null;
  member_email: string | null;
  member_facebook: string | null;
  member_twitter: string | null;
  member_instagram: string | null;
  member_website: string | null;
  quote_abstract: string | null;
  quote: string | null;
  description: string | null;
  is_featured: number;
  status: number;
}

interface TestimonialRow {
  id: number;
  salutation: string | null;
  full_name: string;
  review_abstract: string | null;
  review_title: string | null;
  review: string;
  review_rating: number;
  review_date: Date | null;
  country_code: string;
  country_name: string;
  address: string;
  affiliate_organization: string | null;
  organization_address: string | null;
  organization_position: string | null;
  organization_description: string | null;
  organization_link: string | null;
  is_featured: number;
  status: number;
}

interface TripInfoRow {
  id: number;
  info_order: number;
  page_title: string;
  page_description: string;
  status: number;
}

interface GlobalSettingRow {
  id: number;
  is_protected: number;
  key_group: string | null;
  key_label: string;
  global_key: string;
  value_type: string;
  string_value: string | null;
  text_value: string | null;
  file_value: string | null;
  image_value: string | null;
  integer_value: number | null;
  decimal_value: number | null;
  date_value: Date | null;
  description: string | null;
  status: number;
}

interface RedirectRow {
  id: number;
  source: string;
  destination: string;
  is_permanent: number;
  redirect_code: string | null;
  redirect_message: string | null;
  redirect_status: number;
}

const VALUE_TYPE_MAP: Record<string, string> = {
  string: 'STRING',
  text: 'TEXT',
  integer: 'INTEGER',
  decimal: 'DECIMAL',
  boolean: 'BOOLEAN',
  image: 'IMAGE',
  file: 'FILE',
  date: 'DATE',
  json: 'JSON',
};

export async function importContent(): Promise<void> {
  // --- BlogAuthor ---
  const blogAuthors = await queryAll<BlogAuthorRow>('SELECT * FROM base_blog_authors');
  for (const row of blogAuthors) {
    const created = await prisma.blogAuthor.create({
      data: {
        name: row.name,
        salutation: nullIfEmpty(row.salutation),
        email: row.email,
        description: nullIfEmpty(row.description),
        isActive: bool(row.status, true),
      },
    });
    idMap.set('blog-author', row.id, created.id);
  }
  report.record('base_blog_authors', blogAuthors.length, blogAuthors.length);

  // --- Blog + author/category/tag junctions ---
  const blogs = await queryAll<BlogRow>('SELECT * FROM base_blogs');
  for (const row of blogs) {
    const created = await prisma.blog.create({
      data: {
        title: row.title,
        abstract: nullIfEmpty(row.abstract),
        content: row.content,
        blogDate: row.blog_date ?? new Date(),
        isActive: bool(row.publish_status),
      },
    });
    idMap.set('blog', row.id, created.id);
  }
  report.record('base_blogs', blogs.length, blogs.length);

  const blogAuthorLinks = await queryAll<{ blog_id: number; author_id: number }>(
    'SELECT blog_id, author_id FROM base_blog_blogauthor',
  );
  let blogAuthorLinkCount = 0;
  for (const link of blogAuthorLinks) {
    const blogId = idMap.get('blog', link.blog_id);
    const authorId = idMap.get('blog-author', link.author_id);
    if (!blogId || !authorId) continue;
    await prisma.blog.update({ where: { id: blogId }, data: { authors: { connect: [{ id: authorId }] } } });
    blogAuthorLinkCount++;
  }
  report.record('base_blog_blogauthor', blogAuthorLinks.length, blogAuthorLinkCount);

  // category_type_id on this junction is a stale default, not trustworthy —
  // resolve via category_id -> Category (already typed correctly from
  // base_categories.type_id) instead. See plan for details.
  const blogCategoryLinks = await queryAll<{ blog_id: number; category_id: number }>(
    'SELECT blog_id, category_id FROM base_blog_blogcategory',
  );
  let blogCategoryLinkCount = 0;
  for (const link of blogCategoryLinks) {
    const blogId = idMap.get('blog', link.blog_id);
    const categoryId = idMap.get('category', link.category_id);
    if (!blogId || !categoryId) continue;
    await prisma.blog.update({ where: { id: blogId }, data: { categories: { connect: [{ id: categoryId }] } } });
    blogCategoryLinkCount++;
  }
  report.record('base_blog_blogcategory', blogCategoryLinks.length, blogCategoryLinkCount);

  const blogTagLinks = await queryAll<{ blog_id: number; tag_id: number }>(
    'SELECT blog_id, tag_id FROM base_blog_blogtag',
  );
  let blogTagLinkCount = 0;
  for (const link of blogTagLinks) {
    const blogId = idMap.get('blog', link.blog_id);
    const tagId = idMap.get('tag', link.tag_id);
    if (!blogId || !tagId) continue;
    await prisma.blog.update({ where: { id: blogId }, data: { tags: { connect: [{ id: tagId }] } } });
    blogTagLinkCount++;
  }
  report.record('base_blog_blogtag', blogTagLinks.length, blogTagLinkCount);

  // --- StoryAuthor / Story (both empty in this dump — kept generic in case a
  // future re-run has data) ---
  const storyAuthors = await queryAll<StoryAuthorRow>('SELECT * FROM travel_story_authors');
  for (const row of storyAuthors) {
    const created = await prisma.storyAuthor.create({
      data: {
        name: row.name,
        salutation: nullIfEmpty(row.salutation),
        email: row.email,
        description: nullIfEmpty(row.description),
        isActive: bool(row.status, true),
      },
    });
    idMap.set('story-author', row.id, created.id);
  }
  report.record('travel_story_authors', storyAuthors.length, storyAuthors.length);

  const stories = await queryAll<StoryRow>('SELECT * FROM travel_stories');
  for (const row of stories) {
    const created = await prisma.story.create({
      data: {
        title: row.title,
        abstract: nullIfEmpty(row.abstract),
        content: row.content,
        storyDate: row.story_date ?? new Date(),
        isActive: bool(row.publish_status),
      },
    });
    idMap.set('story', row.id, created.id);
  }
  report.record('travel_stories', stories.length, stories.length);

  const storyAuthorLinks = await queryAll<{ story_id: number; author_id: number }>(
    'SELECT story_id, author_id FROM travel_story_storyauthor',
  );
  let storyAuthorLinkCount = 0;
  for (const link of storyAuthorLinks) {
    const storyId = idMap.get('story', link.story_id);
    const authorId = idMap.get('story-author', link.author_id);
    if (!storyId || !authorId) continue;
    await prisma.story.update({ where: { id: storyId }, data: { authors: { connect: [{ id: authorId }] } } });
    storyAuthorLinkCount++;
  }
  report.record('travel_story_storyauthor', storyAuthorLinks.length, storyAuthorLinkCount);

  // --- TeamMember + category junction ---
  const teamMembers = await queryAll<TeamMemberRow>('SELECT * FROM base_team_members');
  for (const row of teamMembers) {
    const created = await prisma.teamMember.create({
      data: {
        position: row.position,
        positionOrder: row.position_order ?? 0,
        salutation: nullIfEmpty(row.salutation),
        fullName: row.full_name,
        countryCode: row.country_code,
        countryName: row.country_name,
        memberAddress: row.member_address,
        memberPhone: nullIfEmpty(row.member_phone),
        memberEmail: nullIfEmpty(row.member_email),
        memberFacebook: nullIfEmpty(row.member_facebook),
        memberTwitter: nullIfEmpty(row.member_twitter),
        memberInstagram: nullIfEmpty(row.member_instagram),
        memberWebsite: nullIfEmpty(row.member_website),
        quoteAbstract: nullIfEmpty(row.quote_abstract),
        quote: nullIfEmpty(row.quote),
        description: nullIfEmpty(row.description),
        isFeatured: bool(row.is_featured),
        isActive: bool(row.status, true),
      },
    });
    idMap.set('team-member', row.id, created.id);
  }
  report.record('base_team_members', teamMembers.length, teamMembers.length);

  const teamCategoryLinks = await queryAll<{ member_id: number; category_id: number }>(
    'SELECT member_id, category_id FROM base_team_membercategory',
  );
  let teamCategoryLinkCount = 0;
  for (const link of teamCategoryLinks) {
    const memberId = idMap.get('team-member', link.member_id);
    const categoryId = idMap.get('category', link.category_id);
    if (!memberId || !categoryId) continue;
    await prisma.teamMember.update({
      where: { id: memberId },
      data: { categories: { connect: [{ id: categoryId }] } },
    });
    teamCategoryLinkCount++;
  }
  report.record('base_team_membercategory', teamCategoryLinks.length, teamCategoryLinkCount);

  // --- Testimonial + team-member junction (package junction has 0 legacy rows) ---
  const testimonials = await queryAll<TestimonialRow>('SELECT * FROM base_testimonials');
  for (const row of testimonials) {
    const created = await prisma.testimonial.create({
      data: {
        salutation: nullIfEmpty(row.salutation),
        fullName: row.full_name,
        reviewAbstract: nullIfEmpty(row.review_abstract),
        reviewTitle: nullIfEmpty(row.review_title),
        review: row.review,
        reviewRating: row.review_rating ?? null,
        reviewDate: row.review_date,
        countryCode: row.country_code,
        countryName: row.country_name,
        address: nullIfEmpty(row.address),
        affiliateOrganization: nullIfEmpty(row.affiliate_organization),
        organizationAddress: nullIfEmpty(row.organization_address),
        organizationPosition: nullIfEmpty(row.organization_position),
        organizationDescription: nullIfEmpty(row.organization_description),
        organizationLink: nullIfEmpty(row.organization_link),
        isFeatured: bool(row.is_featured),
        isActive: bool(row.status, true),
      },
    });
    idMap.set('testimonial', row.id, created.id);
  }
  report.record('base_testimonials', testimonials.length, testimonials.length);

  const testimonialMemberLinks = await queryAll<{ testimonial_id: number; member_id: number }>(
    'SELECT testimonial_id, member_id FROM travel_testimonial_member',
  );
  let testimonialMemberLinkCount = 0;
  for (const link of testimonialMemberLinks) {
    const testimonialId = idMap.get('testimonial', link.testimonial_id);
    const memberId = idMap.get('team-member', link.member_id);
    if (!testimonialId || !memberId) continue;
    await prisma.testimonial.update({
      where: { id: testimonialId },
      data: { members: { connect: [{ id: memberId }] } },
    });
    testimonialMemberLinkCount++;
  }
  report.record('travel_testimonial_member', testimonialMemberLinks.length, testimonialMemberLinkCount);

  // --- TripInfo (package junction happens in the package phase) ---
  const tripInfos = await queryAll<TripInfoRow>('SELECT * FROM travel_tripinfo');
  for (const row of tripInfos) {
    const created = await prisma.tripInfo.create({
      data: {
        title: row.page_title,
        description: row.page_description,
        infoOrder: row.info_order ?? 0,
        isActive: bool(row.status, true),
      },
    });
    idMap.set('trip-info', row.id, created.id);
  }
  report.record('travel_tripinfo', tripInfos.length, tripInfos.length);

  // --- GlobalSetting (GlobalCategory has 0 legacy rows -> categoryId stays null) ---
  const globalSettings = await queryAll<GlobalSettingRow>('SELECT * FROM base_global_settings');
  for (const row of globalSettings) {
    const valueType = VALUE_TYPE_MAP[row.value_type] ?? 'STRING';
    let value: string | null = null;
    switch (row.value_type) {
      case 'string':
        value = nullIfEmpty(row.string_value);
        break;
      case 'text':
        value = nullIfEmpty(row.text_value);
        break;
      case 'integer':
        value = row.integer_value === null ? null : String(row.integer_value);
        break;
      case 'decimal':
        value = row.decimal_value === null ? null : String(row.decimal_value);
        break;
      case 'date':
        value = row.date_value ? row.date_value.toISOString() : null;
        break;
      case 'image':
        value = resolveMediaPath(row.image_value);
        break;
      case 'file':
        value = resolveMediaPath(row.file_value);
        break;
      default:
        value = nullIfEmpty(row.string_value) ?? nullIfEmpty(row.text_value);
    }
    await prisma.globalSetting.create({
      data: {
        key: row.global_key,
        keyGroup: nullIfEmpty(row.key_group),
        label: nullIfEmpty(row.key_label),
        valueType: valueType as never,
        value,
        isProtected: bool(row.is_protected),
        description: nullIfEmpty(row.description),
        isActive: bool(row.status, true),
      },
    });
  }
  report.record('base_global_settings', globalSettings.length, globalSettings.length);

  // --- RedirectManager ---
  const redirects = await queryAll<RedirectRow>('SELECT * FROM base_redirects');
  let redirectCount = 0;
  const seenSources = new Set<string>();
  for (const row of redirects) {
    // `source` is unique in the new schema; legacy has no such constraint —
    // keep the first occurrence, log the rest instead of crashing the phase.
    if (seenSources.has(row.source)) {
      console.warn(`  base_redirects#${row.id}: duplicate source "${row.source}", skipped`);
      continue;
    }
    seenSources.add(row.source);
    await prisma.redirectManager.create({
      data: {
        source: row.source,
        destination: row.destination,
        isPermanent: bool(row.is_permanent, true),
        redirectCode: nullIfEmpty(row.redirect_code),
        redirectMessage: nullIfEmpty(row.redirect_message),
        redirectStatus: bool(row.redirect_status, true),
      },
    });
    redirectCount++;
  }
  report.record('base_redirects', redirects.length, redirectCount);
}
