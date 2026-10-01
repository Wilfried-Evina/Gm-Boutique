import{A as e,Ct as t,O as n,h as r,l as i,o as a,p as o,r as s,s as c,u as l}from"./runtime-core.esm-bundler-CCEMGXwE.js";import{m as u}from"./index-CoqQukLu.js";var d={checkout:async e=>(await u.post(`/sales/checkout`,e)).data,createHistoricalFull:async e=>(await u.post(`/sales/historical-full`,e)).data,getAll:async()=>(await u.get(`/sales`)).data,generateSalesReport:async(e,t)=>(await u.post(`/documents/generate/sales-report`,{startDate:e,endDate:t})).data,generateSalesReportCSV:async(e,t)=>(await u.post(`/documents/generate/sales-report-csv`,{startDate:e,endDate:t},{responseType:`blob`})).data},f={key:0,class:`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm transition-all duration-300`},p={class:`bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200`},m={class:`flex-1 overflow-y-auto p-6 bg-gray-100/50 flex justify-center`},h={class:`bg-white p-6 shadow-md border border-gray-200 w-[80mm] min-h-[150mm] font-mono text-sm text-center flex flex-col items-center`},g={class:`w-full text-left text-xs mb-4`},_={class:`w-full text-left text-xs mb-2`},v={class:`py-1 pr-2`},y={class:`font-bold`},b={class:`text-[10px] text-gray-500`},x={class:`py-1 text-right font-bold`},S={class:`w-full flex justify-between font-bold text-base my-2`},C={class:`w-full text-center text-xs mt-4`},w=r({__name:`ReceiptPreviewModal`,props:{isOpen:{type:Boolean},sale:{}},emits:[`close`],setup(r,{emit:u}){let d=r,w=u,T=()=>{w(`close`)},E=a(()=>d.sale?.createdAt?new Intl.DateTimeFormat(`fr-CH`,{dateStyle:`long`,timeStyle:`short`}).format(new Date(d.sale.createdAt)):``),D=a(()=>d.sale?{card:`Carte Bancaire`,cash:`Espèces`,twint:`TWINT`}[d.sale.paymentMethod]||d.sale.paymentMethod:``),O=a(()=>!d.sale||!d.sale.articles?[]:d.sale.articles.map(e=>({_id:e._id,brand:e.brand,type:e.type,barcode:e.barcode,publicPrice:e.publicPrice}))),k=()=>{let e=window.open(``,``,`height=800,width=400`);if(!e){alert(`Veuillez autoriser les pop-ups pour imprimer.`);return}let t=``;O.value.forEach(e=>{t+=`
      <tr>
        <td style="padding-bottom: 4px;">
          <strong>${e.brand} - ${e.type}</strong><br>
          <small style="color: #666;">${e.barcode}</small>
        </td>
        <td style="text-align: right; vertical-align: top; padding-bottom: 4px;">
          <strong>${e.publicPrice.toFixed(2)}</strong>
        </td>
      </tr>
    `}),e.document.write(`
    <html>
      <head>
        <title>Ticket de Caisse</title>
        <style>
          body { 
            margin: 0; 
            padding: 0; 
            font-family: 'Courier New', Courier, monospace; 
            font-size: 12px; 
            color: black; 
            background: white; 
          }
          .thermal-receipt {
            width: 80mm;
            padding: 5mm;
          }
          .thermal-header, .thermal-footer {
            text-align: center;
            margin-bottom: 10px;
          }
          .thermal-header h1 {
            font-size: 18px;
            margin: 0 0 5px 0;
          }
          .thermal-header p, .thermal-footer p {
            margin: 2px 0;
            font-size: 12px;
          }
          .thermal-divider {
            text-align: center;
            margin: 5px 0;
            font-size: 12px;
          }
          .thermal-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5px;
          }
          .thermal-table th, .thermal-table td {
            padding: 2px 0;
            vertical-align: top;
          }
          @media print {
            @page { margin: 0; size: 80mm auto; }
          }
        </style>
      </head>
      <body>
        <div class="thermal-receipt">
          <div class="thermal-header">
            <img src="${window.location.origin}/logo.png" style="width: 100%; max-width: 120px; margin: 0 auto 5px auto; display: block;" alt="GMBoutique" />
            <p>Ticket de Caisse</p>
            <p>Réf: ${d.sale?.reference}</p>
            <p>${E.value}</p>
          </div>
          <div class="thermal-divider">--------------------------------</div>
          <table class="thermal-table">
            <thead>
              <tr>
                <th style="text-align: left;">Article</th>
                <th style="text-align: right;">Prix</th>
              </tr>
            </thead>
            <tbody>
              ${t}
            </tbody>
          </table>
          <div class="thermal-divider">--------------------------------</div>
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-top: 5px;">
            <span>TOTAL</span>
            <span>${d.sale?.totalAmount.toFixed(2)} CHF</span>
          </div>
          <div class="thermal-divider">--------------------------------</div>
          <div class="thermal-footer">
            <p>Paiement: ${D.value}</p>
            <p>Merci de votre visite et à bientôt !</p>
          </div>
        </div>
        <script>
          setTimeout(() => {
            window.print();
            window.close();
          }, 500);
        <\/script>
      </body>
    </html>
  `),e.document.close()};return(a,u)=>r.isOpen?(n(),l(`div`,f,[c(`div`,p,[c(`div`,{class:`flex items-center justify-center relative px-6 py-4 border-b border-gray-100 bg-gray-50/50`},[u[1]||=c(`h3`,{class:`text-lg font-bold text-gray-900`},`Ticket de Caisse`,-1),c(`button`,{onClick:T,class:`absolute right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors`},[...u[0]||=[c(`svg`,{class:`w-5 h-5`,fill:`none`,viewBox:`0 0 24 24`,stroke:`currentColor`},[c(`path`,{"stroke-linecap":`round`,"stroke-linejoin":`round`,"stroke-width":`2`,d:`M6 18L18 6M6 6l12 12`})],-1)]])]),c(`div`,m,[c(`div`,h,[u[5]||=c(`img`,{src:`/logo.png`,class:`w-full max-w-[120px] mb-2 object-contain`,alt:`GMBoutique`},null,-1),u[6]||=c(`p`,{class:`mb-4 text-xs`},`Ticket de Caisse`,-1),c(`div`,g,[c(`p`,null,`Réf: `+t(r.sale?.reference),1),c(`p`,null,t(E.value),1)]),u[7]||=c(`div`,{class:`w-full border-t border-dashed border-gray-400 my-2`},null,-1),c(`table`,_,[u[2]||=c(`thead`,null,[c(`tr`,null,[c(`th`,{class:`pb-2`},`Article`),c(`th`,{class:`pb-2 text-right`},`Prix`)])],-1),c(`tbody`,null,[(n(!0),l(s,null,e(O.value,e=>(n(),l(`tr`,{key:e._id},[c(`td`,v,[c(`div`,y,t(e.brand)+` - `+t(e.type),1),c(`div`,b,t(e.barcode),1)]),c(`td`,x,t(e.publicPrice.toFixed(2)),1)]))),128))])]),u[8]||=c(`div`,{class:`w-full border-t border-dashed border-gray-400 my-2`},null,-1),c(`div`,S,[u[3]||=c(`span`,null,`TOTAL`,-1),c(`span`,null,t(r.sale?.totalAmount.toFixed(2))+` CHF`,1)]),u[9]||=c(`div`,{class:`w-full border-t border-dashed border-gray-400 my-2`},null,-1),c(`div`,C,[c(`p`,null,`Paiement: `+t(D.value),1),u[4]||=c(`p`,{class:`mt-4`},`Merci de votre visite et à bientôt !`,-1)])])]),c(`div`,{class:`px-6 py-4 border-t border-gray-100 bg-white flex justify-end gap-3`},[c(`button`,{onClick:T,class:`px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors`},` Fermer `),c(`button`,{onClick:k,class:`flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-black rounded-xl hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all shadow-md hover:shadow-lg`},[...u[10]||=[c(`svg`,{class:`w-4 h-4`,fill:`none`,viewBox:`0 0 24 24`,stroke:`currentColor`},[c(`path`,{"stroke-linecap":`round`,"stroke-linejoin":`round`,"stroke-width":`2`,d:`M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z`})],-1),o(` Imprimer `,-1)]])])])])):i(``,!0)}});export{d as n,w as t};