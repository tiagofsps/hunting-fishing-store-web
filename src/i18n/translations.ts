export type Language = 'en' | 'pt';

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.categories': 'Categories',
    'nav.featured': 'Featured',
    'nav.brands': 'Brands',
    'nav.advantages': 'Advantages',
    'nav.searchPlaceholder': 'Search products...',
    'nav.cart': 'Cart',
    'nav.openMenu': 'Open menu',
    'nav.closeMenu': 'Close menu',

    // Promotion Banner
    'promo.badge': 'Special Offer',
    'promo.defaultMessage': 'Free shipping on orders over €75 | Use code NORTE10 for 10% off your first purchase!',

    // Hero Section
    'hero.badge': 'Outdoor & Adventure • 2026 Collection',
    'hero.titlePart1': 'Everything to go further on ',
    'hero.titleHighlight': 'water and land.',
    'hero.subtitle': 'High-precision equipment and technical apparel selected for fishing and hunting enthusiasts who demand maximum performance, safety, and durability.',
    'hero.ctaPrimary': 'Explore Gear',
    'hero.ctaSecondary': 'Categories',
    'hero.stat1Number': '+5,000',
    'hero.stat1Label': 'Products in Stock',
    'hero.stat2Number': '100%',
    'hero.stat2Label': 'Licensed Gear',
    'hero.stat3Number': '24h/48h',
    'hero.stat3Label': 'National Shipping',
    'hero.cardBadge': 'Season Highlight',
    'hero.cardTitle': 'Pro Series Hunting & Fishing Gear',
    'hero.cardSubtitle': 'Tested in extreme weather conditions.',

    // Value Props Section
    'val.prop1Title': 'Fast 24/48h Shipping',
    'val.prop1Desc': 'Express national delivery with real-time tracking.',
    'val.prop2Title': '100% Certified Gear',
    'val.prop2Desc': 'Full compliance with hunting and fishing regulations.',
    'val.prop3Title': 'Expert Guidance',
    'val.prop3Desc': 'Passionate specialists ready to assist your selection.',
    'val.prop4Title': '100% Secure Payment',
    'val.prop4Desc': 'Credit Card, MBWay, Multibanco, or Klarna with advanced encryption.',

    // Category Section
    'cat.subtitle': 'Specialized Catalog',
    'cat.title': 'Explore by Category',
    'cat.description': 'Gear tested and curated for each environment and activity.',
    'cat.viewAll': 'View All',
    'cat.available': 'products available',

    // Product Section
    'prod.subtitle': 'Main Catalog',
    'prod.title': 'Featured Products & Gear',
    'prod.allPill': 'All',
    'prod.sortDefault': 'Sort: Featured',
    'prod.sortPriceAsc': 'Price: Low → High',
    'prod.sortPriceDesc': 'Price: High → Low',
    'prod.sortName': 'Name (A-Z)',
    'prod.emptyTitle': 'No products found',
    'prod.emptyDesc': 'Try adjusting your search or category filters.',
    'prod.clearFilters': 'Clear Filters',
    'prod.licenseRequired': 'License Req.',
    'prod.lastUnits': 'Low Stock',
    'prod.soldOut': 'Sold Out',
    'prod.quickView': 'Quick View',
    'prod.inStock': 'in stock',
    'prod.addToCart': 'Add to Cart',
    'prod.unavailable': 'Unavailable',

    // Quick View Modal
    'modal.inStock': 'In Stock',
    'modal.units': 'units',
    'modal.soldOut': 'Sold Out',
    'modal.licenseRequired': 'License Required',
    'modal.variantLabel': 'Option / Variant',
    'modal.taxIncluded': 'VAT included',
    'modal.addedToCart': 'Added to Cart!',
    'modal.guarantee': '🔒 14-Day Money Back Guarantee • Fast & Secure Delivery',

    // Cart Drawer
    'cart.title': 'Your Cart',
    'cart.itemSingular': 'item',
    'cart.itemPlural': 'items',
    'cart.freeShippingAchieved': '🎉 Congratulations! You have Free Shipping!',
    'cart.freeShippingRemainingPrefix': 'Add ',
    'cart.freeShippingRemainingSuffix': ' more for Free Shipping',
    'cart.emptyTitle': 'Your cart is empty',
    'cart.emptyDesc': 'Explore our catalog and discover top-quality equipment!',
    'cart.continueShopping': 'Continue Shopping',
    'cart.removeTooltip': 'Remove product',
    'cart.subtotal': 'Subtotal',
    'cart.shipping': 'Shipping',
    'cart.shippingFree': 'Free',
    'cart.total': 'Total',
    'cart.checkoutButton': 'Complete Order',
    'cart.clearCart': 'Empty Cart',

    // Brand Section
    'brand.subtitle': 'Trusted Partners',
    'brand.title': 'We work with top world-class brands',

    // CTA Newsletter
    'cta.title': 'Ready for your next outdoor adventure?',
    'cta.subtitle': 'Join thousands of enthusiasts and receive expert tips and exclusive deals in your inbox.',
    'cta.successTitle': 'Thank you for subscribing!',
    'cta.successSub': 'Check your inbox soon.',
    'cta.emailPlaceholder': 'Your email address',
    'cta.submitting': 'Sending...',
    'cta.subscribe': 'Subscribe',
    'cta.disclaimer': 'We promise no spam. Unsubscribe at any time.',

    // Footer
    'footer.description': 'Your trusted store for fishing, hunting, and outdoor gear. Premium equipment for boundary pushers.',
    'footer.storeHeading': 'Shop',
    'footer.supportHeading': 'Customer Support',
    'footer.locationHeading': 'Our Location',
    'footer.rights': 'All rights reserved.',

    // Common
    'common.retry': 'Try Again',
    'common.loading': 'Loading catalog data...',
    'common.errorTitle': 'Error loading catalog data:',
  },
  pt: {
    // Navigation
    'nav.home': 'Início',
    'nav.categories': 'Categorias',
    'nav.featured': 'Destaques',
    'nav.brands': 'Marcas',
    'nav.advantages': 'Vantagens',
    'nav.searchPlaceholder': 'Buscar produtos...',
    'nav.cart': 'Cesto',
    'nav.openMenu': 'Abrir menu',
    'nav.closeMenu': 'Fechar menu',

    // Promotion Banner
    'promo.badge': 'Oferta Especial',
    'promo.defaultMessage': 'Envio Grátis em compras superiores a 75€ | Usa o código NORTE10 para 10% de desconto!',

    // Hero Section
    'hero.badge': 'Aventura & Natureza • Coleção 2026',
    'hero.titlePart1': 'Tudo para ir mais longe na ',
    'hero.titleHighlight': 'água e no mato.',
    'hero.subtitle': 'Equipamento de alta precisão e vestuário técnico selecionado para entusiastas de pesca e caça que exigem o máximo em desempenho, segurança e durabilidade.',
    'hero.ctaPrimary': 'Ver Equipamentos',
    'hero.ctaSecondary': 'Categorias',
    'hero.stat1Number': '+5.000',
    'hero.stat1Label': 'Produtos em Stock',
    'hero.stat2Number': '100%',
    'hero.stat2Label': 'Licenças Válidas',
    'hero.stat3Number': '24h/48h',
    'hero.stat3Label': 'Entrega Nacional',
    'hero.cardBadge': 'Destaque da Estação',
    'hero.cardTitle': 'Equipamento Pro Series Caça & Pesca',
    'hero.cardSubtitle': 'Testado nas condições meteorológicas mais extremas.',

    // Value Props Section
    'val.prop1Title': 'Envio Rápido 24/48h',
    'val.prop1Desc': 'Entregas céleres em todo o país com rastreio em tempo real.',
    'val.prop2Title': 'Material 100% Homologado',
    'val.prop2Desc': 'Conformidade total com normas de caça e pesca desportiva.',
    'val.prop3Title': 'Aconselhamento Técnico',
    'val.prop3Desc': 'Especialistas disponíveis para te orientar na escolha ideal.',
    'val.prop4Title': 'Pagamento 100% Seguro',
    'val.prop4Desc': 'MultiBanco, MBWay, Cartão de Crédito ou Klarna com encriptação.',

    // Category Section
    'cat.subtitle': 'Catálogo Especializado',
    'cat.title': 'Explore por Categorias',
    'cat.description': 'Equipamento testado e selecionado para cada ambiente e modalidade.',
    'cat.viewAll': 'Ver Todas',
    'cat.available': 'produtos disponíveis',

    // Product Section
    'prod.subtitle': 'Catálogo Principal',
    'prod.title': 'Equipamento & Produtos em Destaque',
    'prod.allPill': 'Todos',
    'prod.sortDefault': 'Ordenar: Destaques',
    'prod.sortPriceAsc': 'Preço: Menor → Maior',
    'prod.sortPriceDesc': 'Preço: Maior → Menor',
    'prod.sortName': 'Nome (A-Z)',
    'prod.emptyTitle': 'Nenhum produto encontrado',
    'prod.emptyDesc': 'Tenta ajustar a pesquisa ou os filtros de categoria.',
    'prod.clearFilters': 'Limpar Filtros',
    'prod.licenseRequired': 'Licença',
    'prod.lastUnits': 'Últimas Unidades',
    'prod.soldOut': 'Esgotado',
    'prod.quickView': 'Vista Rápida',
    'prod.inStock': 'em stock',
    'prod.addToCart': 'Adicionar ao Cesto',
    'prod.unavailable': 'Indisponível',

    // Quick View Modal
    'modal.inStock': 'Em Stock',
    'modal.units': 'unidades',
    'modal.soldOut': 'Esgotado',
    'modal.licenseRequired': 'Licença Obrigatória',
    'modal.variantLabel': 'Opção / Variante',
    'modal.taxIncluded': 'IVA incluído',
    'modal.addedToCart': 'Adicionado ao Cesto!',
    'modal.guarantee': '🔒 Garantia de Devolução 14 Dias • Envio Rápido e Seguro',

    // Cart Drawer
    'cart.title': 'O teu Cesto',
    'cart.itemSingular': 'item',
    'cart.itemPlural': 'itens',
    'cart.freeShippingAchieved': '🎉 Parabéns! Tens Envio Grátis!',
    'cart.freeShippingRemainingPrefix': 'Faltam ',
    'cart.freeShippingRemainingSuffix': ' para Envio Grátis',
    'cart.emptyTitle': 'O teu cesto está vazio',
    'cart.emptyDesc': 'Explora o nosso catálogo e descobre o melhor equipamento!',
    'cart.continueShopping': 'Continuar a Comprar',
    'cart.removeTooltip': 'Remover produto',
    'cart.subtotal': 'Subtotal',
    'cart.shipping': 'Envio',
    'cart.shippingFree': 'Grátis',
    'cart.total': 'Total',
    'cart.checkoutButton': 'Finalizar Encomenda',
    'cart.clearCart': 'Esvaziar Cesto',

    // Brand Section
    'brand.subtitle': 'Parceiros de Confiança',
    'brand.title': 'Trabalhamos com as melhores marcas mundiais',

    // CTA Newsletter
    'cta.title': 'Preparado para a tua próxima aventura?',
    'cta.subtitle': 'Junta-te a milhares de entusiastas e recebe as melhores dicas e promoções no teu e-mail.',
    'cta.successTitle': 'Obrigado por subscrever!',
    'cta.successSub': 'Verifica a tua caixa de correio em breve.',
    'cta.emailPlaceholder': 'O teu e-mail',
    'cta.submitting': 'A enviar...',
    'cta.subscribe': 'Subscrever',
    'cta.disclaimer': 'Prometemos não encher a tua caixa de correio. Podes cancelar a qualquer momento.',

    // Footer
    'footer.description': 'A tua loja de confiança para pesca, caça e outdoor. Equipamento premium para quem não conhece limites.',
    'footer.storeHeading': 'Loja',
    'footer.supportHeading': 'Apoio ao Cliente',
    'footer.locationHeading': 'Onde Estamos',
    'footer.rights': 'Todos os direitos reservados.',

    // Common
    'common.retry': 'Tentar novamente',
    'common.loading': 'A carregar produtos e categorias do catálogo...',
    'common.errorTitle': 'Erro ao carregar dados:',
  },
};
