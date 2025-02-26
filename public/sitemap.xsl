
<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <title>Soundraiser XML Sitemap</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <style type="text/css">
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 14px;
            color: #333;
            background: #f5f5f7;
            max-width: 75em;
            margin: 0 auto;
            padding: 2em;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 1em 0;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          th {
            background: #6851FB;
            color: white;
            text-align: left;
            padding: 1em;
          }
          td {
            padding: 1em;
            border-top: 1px solid #eee;
          }
          tr:hover td {
            background: #f7f7f7;
          }
          h1 {
            color: #6851FB;
            font-size: 24px;
            margin-bottom: 1em;
          }
          .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1em;
            margin-bottom: 2em;
          }
          .stat-card {
            background: white;
            padding: 1em;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #6851FB;
          }
          .stat-label {
            color: #666;
            font-size: 12px;
            text-transform: uppercase;
          }
          a {
            color: #6851FB;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <h1>
          <xsl:choose>
            <xsl:when test="sitemap:sitemapindex">Soundraiser XML Sitemap Index</xsl:when>
            <xsl:otherwise>Soundraiser XML Sitemap</xsl:otherwise>
          </xsl:choose>
        </h1>
        
        <xsl:apply-templates/>
      </body>
    </html>
  </xsl:template>
  
  <xsl:template match="sitemap:sitemapindex">
    <div class="stats">
      <div class="stat-card">
        <div class="stat-value"><xsl:value-of select="count(sitemap:sitemap)"/></div>
        <div class="stat-label">Total Sitemaps</div>
      </div>
    </div>
    <table>
      <tr>
        <th>Sitemap URL</th>
        <th>Last Modified</th>
      </tr>
      <xsl:for-each select="sitemap:sitemap">
        <tr>
          <td><a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a></td>
          <td><xsl:value-of select="sitemap:lastmod"/></td>
        </tr>
      </xsl:for-each>
    </table>
  </xsl:template>
  
  <xsl:template match="sitemap:urlset">
    <div class="stats">
      <div class="stat-card">
        <div class="stat-value"><xsl:value-of select="count(sitemap:url)"/></div>
        <div class="stat-label">Total URLs</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">
          <xsl:value-of select="count(sitemap:url[contains(sitemap:loc, '/blog/')])"/>
        </div>
        <div class="stat-label">Blog Posts</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">
          <xsl:value-of select="count(sitemap:url[contains(sitemap:loc, '/link/')])"/>
        </div>
        <div class="stat-label">Smart Links</div>
      </div>
    </div>
    <table>
      <tr>
        <th>URL</th>
        <th>Last Modified</th>
        <th>Change Frequency</th>
        <th>Priority</th>
      </tr>
      <xsl:for-each select="sitemap:url">
        <tr>
          <td><a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a></td>
          <td><xsl:value-of select="sitemap:lastmod"/></td>
          <td><xsl:value-of select="sitemap:changefreq"/></td>
          <td><xsl:value-of select="sitemap:priority"/></td>
        </tr>
      </xsl:for-each>
    </table>
  </xsl:template>
</xsl:stylesheet>
