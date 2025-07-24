import Head from "next/head"

interface SocialMetaProps {
  title: string
  description: string
  image?: string
  url: string
  type?: "website" | "article"
  author?: string
}

export function SocialMeta({ title, description, image, url, type = "article", author }: SocialMetaProps) {
  const fullTitle = `${title} | JTDRecipe`
  const defaultImage = "/placeholder.svg?height=630&width=1200"
  const socialImage = image || defaultImage

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="author" content={author || "JTDRecipe"} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={socialImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="JTDRecipe" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={socialImage} />
      <meta property="twitter:creator" content="@JTDRecipe" />

      {/* Pinterest */}
      <meta property="pinterest:title" content={fullTitle} />
      <meta property="pinterest:description" content={description} />
      <meta property="pinterest:image" content={socialImage} />

      {/* Additional Recipe-specific meta */}
      {type === "article" && (
        <>
          <meta property="article:author" content={author} />
          <meta property="article:section" content="Recipes" />
          <meta property="article:tag" content="recipe" />
        </>
      )}

      {/* Canonical URL */}
      <link rel="canonical" href={url} />
    </Head>
  )
}
