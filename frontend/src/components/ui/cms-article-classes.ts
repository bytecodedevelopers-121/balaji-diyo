/**
 * Extra `CmsProse` classes for long-form articles (blog posts, destination
 * pages): star-bookmark bullets, peach zebra-striped tables and a peach note
 * box for blockquotes.
 */
export const CMS_ARTICLE_CLASSES = [
  "[&_ul]:list-none [&_ul]:pl-0",
  "[&_ul>li]:relative [&_ul>li]:pl-9 [&_ul>li]:before:absolute [&_ul>li]:before:top-1 [&_ul>li]:before:left-0 [&_ul>li]:before:size-6 [&_ul>li]:before:bg-[url('/icons/star-bookmark.svg')] [&_ul>li]:before:bg-contain [&_ul>li]:before:bg-no-repeat [&_ul>li]:before:content-['']",
  "[&_th]:border-0 [&_th]:bg-transparent [&_th]:font-medium [&_th]:text-primary-500 [&_td]:border-0 [&_tbody_tr:nth-child(odd)]:bg-[#fdf1e8]",
  "[&_blockquote]:rounded-[4px] [&_blockquote]:border-0 [&_blockquote]:bg-[#fdf1e8] [&_blockquote]:p-6 [&_blockquote]:text-[15px]",
  "text-[15px] [&_h2]:text-[24px] [&_h3]:text-[19px]",
].join(" ");
