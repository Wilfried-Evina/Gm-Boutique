import { apiClient } from '../api/client';

export const printArticlesLabels = async (articles: any[]) => {
  if (!articles || articles.length === 0) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Le navigateur a bloqué l'ouverture de la fenêtre d'impression.");
    return;
  }

  // Écrire la structure de base
  printWindow.document.write(`
    <html>
      <head>
        <title>Impression d'étiquettes</title>
        <style>
          @page { size: 62mm 29mm; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body, html { 
            margin: 0; 
            padding: 0;
            font-family: system-ui, -apple-system, sans-serif;
            background: white;
          }
          .label-page {
            width: 100%;
            height: 100vh; /* S'adapte exactement à la hauteur d'une page imprimable */
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 0;
            page-break-after: always;
            page-break-inside: avoid;
            overflow: hidden;
          }
          .brand { font-size: 14px; font-weight: 800; text-transform: uppercase; margin-bottom: 2px; }
          .details { font-size: 11px; color: #333; margin-bottom: 4px; }
          .price-only { font-size: 20px; font-weight: 900; }
          img.barcode-img { max-width: 90%; height: 16mm; object-fit: contain; }
        </style>
      </head>
      <body>
        <div id="content">Génération des étiquettes en cours... Veuillez patienter.</div>
      </body>
    </html>
  `);

  try {
    // Récupérer toutes les images de codes-barres en parallèle
    const fetchPromises = articles.map(async (article) => {
      try {
        const response = await apiClient.get(`/articles/${article._id}/barcode`, { responseType: 'blob' });
        const imageUrl = URL.createObjectURL(response.data);
        return { article, imageUrl };
      } catch (e) {
        console.error(`Erreur pour ${article.barcode}`, e);
        return null;
      }
    });

    const results = await Promise.all(fetchPromises);
    const validResults = results.filter(r => r !== null) as { article: any, imageUrl: string }[];

    let htmlContent = '';
    
    for (const { article, imageUrl } of validResults) {
      const brand = article.brand || 'Marque inconnue';
      const typeAndColor = `${article.type || ''} - ${article.color || ''}`;
      
      let price = '';
      if (typeof article.publicPrice === 'number') {
        price = Number.isInteger(article.publicPrice) 
          ? `${article.publicPrice} CHF` 
          : `${article.publicPrice.toFixed(2)} CHF`;
      }

      htmlContent += `
        <!-- Page 1 : Marque, Détails et Prix -->
        <div class="label-page">
          <div class="brand">${brand}</div>
          <div class="details">${typeAndColor}</div>
          <div class="price-only">${price}</div>
        </div>
        <!-- Page 2 : Code-barres uniquement -->
        <div class="label-page">
          <img src="${imageUrl}" class="barcode-img" alt="barcode" />
        </div>
      `;
    }

    if (htmlContent === '') {
      htmlContent = '<div style="padding: 20px;">Erreur lors de la génération des étiquettes.</div>';
    }

    // Injecter le contenu
    printWindow.document.getElementById('content')!.innerHTML = htmlContent;

    // Lancer l'impression avec un léger délai pour que les images se chargent
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
      
      // Nettoyer la mémoire
      validResults.forEach(r => URL.revokeObjectURL(r.imageUrl));
    }, 500);

  } catch (error) {
    printWindow.document.getElementById('content')!.innerHTML = "Une erreur est survenue.";
  }
};
