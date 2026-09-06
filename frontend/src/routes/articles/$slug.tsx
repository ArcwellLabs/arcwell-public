import { createFileRoute } from "@tanstack/react-router";
import ArticleDetail from "@/pages/ArticleDetail";
import { getArticle } from "@/data/articles";

export const Route = createFileRoute("/articles/$slug")({
  head: ({ params }) => {
    const article = getArticle(params.slug);
    const title = article ? `${article.title} — ARCWELL Field Notes` : "Article — ARCWELL";
    const description =
      article?.excerpt ??
      "A field note from ARCWELL on evidence anchoring, audit trails and verifiable records.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  loader: async () => {
    await import("@/data/articles");
  },
  component: ArticleDetail,
});
