/**
 * Food Name Translation Dictionary
 * Maps English food names to localized translations
 */

// Common food translations - English (lowercase) -> locale -> translated name
export const foodTranslationDictionary: Record<string, Record<string, string>> = {
    // Breakfast foods
    'oatmeal': { te: 'ఓట్స్', es: 'avena', hi: 'ओटमील', fr: "flocons d'avoine", de: 'Haferflocken', zh: '燕麦片' },
    'oats': { te: 'ఓట్స్', es: 'avena', hi: 'ओट्स', fr: 'avoine', de: 'Hafer', zh: '燕麦' },
    'eggs': { te: 'గుడ్లు', es: 'huevos', hi: 'अंडे', fr: 'œufs', de: 'Eier', zh: '鸡蛋' },
    'egg': { te: 'గుడ్డు', es: 'huevo', hi: 'अंडा', fr: 'œuf', de: 'Ei', zh: '鸡蛋' },
    'scrambled eggs': { te: 'స్క్రాంబుల్డ్ గుడ్లు', es: 'huevos revueltos', hi: 'स्क्रैंबल्ड अंडे', fr: 'œufs brouillés', de: 'Rührei', zh: '炒蛋' },
    'toast': { te: 'టోస్ట్', es: 'tostada', hi: 'टोस्ट', fr: 'toast', de: 'Toast', zh: '吐司' },
    'bread': { te: 'రొట్టె', es: 'pan', hi: 'रोटी', fr: 'pain', de: 'Brot', zh: '面包' },
    'pancakes': { te: 'పాన్‌కేక్స్', es: 'panqueques', hi: 'पैनकेक', fr: 'crêpes', de: 'Pfannkuchen', zh: '煎饼' },
    'cereal': { te: 'సీరియల్', es: 'cereal', hi: 'अनाज', fr: 'céréales', de: 'Müsli', zh: '谷物' },
    'yogurt': { te: 'పెరుగు', es: 'yogur', hi: 'दही', fr: 'yaourt', de: 'Joghurt', zh: '酸奶' },
    'greek yogurt': { te: 'గ్రీక్ పెరుగు', es: 'yogur griego', hi: 'ग्रीक दही', fr: 'yaourt grec', de: 'Griechischer Joghurt', zh: '希腊酸奶' },

    // Fruits
    'banana': { te: 'అరటిపండు', es: 'plátano', hi: 'केला', fr: 'banane', de: 'Banane', zh: '香蕉' },
    'apple': { te: 'ఆపిల్', es: 'manzana', hi: 'सेब', fr: 'pomme', de: 'Apfel', zh: '苹果' },
    'orange': { te: 'నారింజ', es: 'naranja', hi: 'संतरा', fr: 'orange', de: 'Orange', zh: '橙子' },
    'grapes': { te: 'ద్రాక్ష', es: 'uvas', hi: 'अंगूर', fr: 'raisins', de: 'Trauben', zh: '葡萄' },
    'mango': { te: 'మామిడి', es: 'mango', hi: 'आम', fr: 'mangue', de: 'Mango', zh: '芒果' },
    'watermelon': { te: 'పుచ్చకాయ', es: 'sandía', hi: 'तरबूज', fr: 'pastèque', de: 'Wassermelone', zh: '西瓜' },
    'strawberries': { te: 'స్ట్రాబెర్రీలు', es: 'fresas', hi: 'स्ट्रॉबेरी', fr: 'fraises', de: 'Erdbeeren', zh: '草莓' },
    'blueberries': { te: 'బ్లూబెర్రీలు', es: 'arándanos', hi: 'ब्लूबेरी', fr: 'myrtilles', de: 'Blaubeeren', zh: '蓝莓' },
    'berries': { te: 'బెర్రీలు', es: 'bayas', hi: 'बेरी', fr: 'baies', de: 'Beeren', zh: '浆果' },
    'pineapple': { te: 'అనాస', es: 'piña', hi: 'अनानास', fr: 'ananas', de: 'Ananas', zh: '菠萝' },
    'papaya': { te: 'బొప్పాయి', es: 'papaya', hi: 'पपीता', fr: 'papaye', de: 'Papaya', zh: '木瓜' },
    'lemon': { te: 'నిమ్మకాయ', es: 'limón', hi: 'नींबू', fr: 'citron', de: 'Zitrone', zh: '柠檬' },
    'avocado': { te: 'అవోకాడో', es: 'aguacate', hi: 'एवोकाडो', fr: 'avocat', de: 'Avocado', zh: '牛油果' },

    // Nuts & Seeds
    'almonds': { te: 'బాదం', es: 'almendras', hi: 'बादाम', fr: 'amandes', de: 'Mandeln', zh: '杏仁' },
    'walnuts': { te: 'వాల్‌నట్స్', es: 'nueces', hi: 'अखरोट', fr: 'noix', de: 'Walnüsse', zh: '核桃' },
    'peanuts': { te: 'వేరుశెనగలు', es: 'cacahuetes', hi: 'मूंगफली', fr: 'cacahuètes', de: 'Erdnüsse', zh: '花生' },
    'peanut butter': { te: 'వేరుశెనగ వెన్న', es: 'mantequilla de maní', hi: 'पीनट बटर', fr: "beurre d'arachide", de: 'Erdnussbutter', zh: '花生酱' },
    'cashews': { te: 'జీడిపప్పులు', es: 'anacardos', hi: 'काजू', fr: 'noix de cajou', de: 'Cashewnüsse', zh: '腰果' },
    'pistachios': { te: 'పిస్తా', es: 'pistachos', hi: 'पिस्ता', fr: 'pistaches', de: 'Pistazien', zh: '开心果' },

    // Proteins
    'chicken': { te: 'కోడి', es: 'pollo', hi: 'मुर्गी', fr: 'poulet', de: 'Hähnchen', zh: '鸡肉' },
    'chicken breast': { te: 'కోడి బ్రెస్ట్', es: 'pechuga de pollo', hi: 'चिकन ब्रेस्ट', fr: 'blanc de poulet', de: 'Hähnchenbrust', zh: '鸡胸肉' },
    'grilled chicken': { te: 'గ్రిల్డ్ కోడి', es: 'pollo a la parrilla', hi: 'ग्रिल्ड चिकन', fr: 'poulet grillé', de: 'gegrilltes Hähnchen', zh: '烤鸡' },
    'beef': { te: 'గొడ్డు మాంసం', es: 'res', hi: 'गोमांस', fr: 'bœuf', de: 'Rindfleisch', zh: '牛肉' },
    'salmon': { te: 'సాల్మన్ చేప', es: 'salmón', hi: 'सैल्मन', fr: 'saumon', de: 'Lachs', zh: '三文鱼' },
    'fish': { te: 'చేప', es: 'pescado', hi: 'मछली', fr: 'poisson', de: 'Fisch', zh: '鱼' },
    'tuna': { te: 'ట్యూనా', es: 'atún', hi: 'टूना', fr: 'thon', de: 'Thunfisch', zh: '金枪鱼' },
    'shrimp': { te: 'రొయ్యలు', es: 'camarones', hi: 'झींगा', fr: 'crevettes', de: 'Garnelen', zh: '虾' },
    'tofu': { te: 'టోఫు', es: 'tofu', hi: 'टोफू', fr: 'tofu', de: 'Tofu', zh: '豆腐' },
    'turkey': { te: 'టర్కీ', es: 'pavo', hi: 'टर्की', fr: 'dinde', de: 'Truthahn', zh: '火鸡' },

    // Dairy
    'milk': { te: 'పాలు', es: 'leche', hi: 'दूध', fr: 'lait', de: 'Milch', zh: '牛奶' },
    'cheese': { te: 'చీజ్', es: 'queso', hi: 'पनीर', fr: 'fromage', de: 'Käse', zh: '奶酪' },
    'butter': { te: 'వెన్న', es: 'mantequilla', hi: 'मक्खन', fr: 'beurre', de: 'Butter', zh: '黄油' },
    'cottage cheese': { te: 'కాటేజ్ చీజ్', es: 'requesón', hi: 'पनीर', fr: 'fromage cottage', de: 'Hüttenkäse', zh: '干酪' },
    'cream': { te: 'క్రీమ్', es: 'crema', hi: 'क्रीम', fr: 'crème', de: 'Sahne', zh: '奶油' },

    // Grains & Carbs
    'rice': { te: 'బియ్యం', es: 'arroz', hi: 'चावल', fr: 'riz', de: 'Reis', zh: '米饭' },
    'brown rice': { te: 'బ్రౌన్ రైస్', es: 'arroz integral', hi: 'ब्राउन राइस', fr: 'riz brun', de: 'brauner Reis', zh: '糙米' },
    'pasta': { te: 'పాస్తా', es: 'pasta', hi: 'पास्ता', fr: 'pâtes', de: 'Nudeln', zh: '意大利面' },
    'noodles': { te: 'నూడిల్స్', es: 'fideos', hi: 'नूडल्स', fr: 'nouilles', de: 'Nudeln', zh: '面条' },
    'quinoa': { te: 'క్వినోవా', es: 'quinoa', hi: 'क्विनोआ', fr: 'quinoa', de: 'Quinoa', zh: '藜麦' },
    'wheat': { te: 'గోధుమ', es: 'trigo', hi: 'गेहूं', fr: 'blé', de: 'Weizen', zh: '小麦' },

    // Vegetables
    'spinach': { te: 'పాలకూర', es: 'espinacas', hi: 'पालक', fr: 'épinards', de: 'Spinat', zh: '菠菜' },
    'tomato': { te: 'టమాటా', es: 'tomate', hi: 'टमाटर', fr: 'tomate', de: 'Tomate', zh: '番茄' },
    'tomatoes': { te: 'టమాటాలు', es: 'tomates', hi: 'टमाटर', fr: 'tomates', de: 'Tomaten', zh: '番茄' },
    'potato': { te: 'బంగాళదుంప', es: 'papa', hi: 'आलू', fr: 'pomme de terre', de: 'Kartoffel', zh: '土豆' },
    'potatoes': { te: 'బంగాళదుంపలు', es: 'papas', hi: 'आलू', fr: 'pommes de terre', de: 'Kartoffeln', zh: '土豆' },
    'sweet potato': { te: 'చిలగడదుంప', es: 'batata', hi: 'शकरकंद', fr: 'patate douce', de: 'Süßkartoffel', zh: '红薯' },
    'carrot': { te: 'క్యారెట్', es: 'zanahoria', hi: 'गाजर', fr: 'carotte', de: 'Karotte', zh: '胡萝卜' },
    'carrots': { te: 'క్యారెట్స్', es: 'zanahorias', hi: 'गाजर', fr: 'carottes', de: 'Karotten', zh: '胡萝卜' },
    'broccoli': { te: 'బ్రోకోలీ', es: 'brócoli', hi: 'ब्रोकली', fr: 'brocoli', de: 'Brokkoli', zh: '西兰花' },
    'onion': { te: 'ఉల్లిపాయ', es: 'cebolla', hi: 'प्याज', fr: 'oignon', de: 'Zwiebel', zh: '洋葱' },
    'garlic': { te: 'వెల్లుల్లి', es: 'ajo', hi: 'लहसुन', fr: 'ail', de: 'Knoblauch', zh: '大蒜' },
    'ginger': { te: 'అల్లం', es: 'jengibre', hi: 'अदरक', fr: 'gingembre', de: 'Ingwer', zh: '姜' },
    'cucumber': { te: 'దోసకాయ', es: 'pepino', hi: 'खीरा', fr: 'concombre', de: 'Gurke', zh: '黄瓜' },
    'lettuce': { te: 'లెట్యూస్', es: 'lechuga', hi: 'सलाद', fr: 'laitue', de: 'Salat', zh: '生菜' },
    'cabbage': { te: 'క్యాబేజీ', es: 'repollo', hi: 'पत्तागोभी', fr: 'chou', de: 'Kohl', zh: '卷心菜' },
    'mushrooms': { te: 'పుట్టగొడుగులు', es: 'champiñones', hi: 'मशरूम', fr: 'champignons', de: 'Pilze', zh: '蘑菇' },
    'bell pepper': { te: 'బెల్ పెప్పర్', es: 'pimiento', hi: 'शिमला मिर्च', fr: 'poivron', de: 'Paprika', zh: '甜椒' },
    'zucchini': { te: 'జుకినీ', es: 'calabacín', hi: 'तोरी', fr: 'courgette', de: 'Zucchini', zh: '西葫芦' },
    'corn': { te: 'మొక్కజొన్న', es: 'maíz', hi: 'मक्का', fr: 'maïs', de: 'Mais', zh: '玉米' },
    'peas': { te: 'బఠానీలు', es: 'guisantes', hi: 'मटर', fr: 'petits pois', de: 'Erbsen', zh: '豌豆' },
    'beans': { te: 'బీన్స్', es: 'frijoles', hi: 'बीन्स', fr: 'haricots', de: 'Bohnen', zh: '豆子' },
    'lentils': { te: 'పప్పు', es: 'lentejas', hi: 'दाल', fr: 'lentilles', de: 'Linsen', zh: '扁豆' },
    'chickpeas': { te: 'శనగలు', es: 'garbanzos', hi: 'छोले', fr: 'pois chiches', de: 'Kichererbsen', zh: '鹰嘴豆' },

    // Beverages
    'coffee': { te: 'కాఫీ', es: 'café', hi: 'कॉफी', fr: 'café', de: 'Kaffee', zh: '咖啡' },
    'tea': { te: 'తేనీరు', es: 'té', hi: 'चाय', fr: 'thé', de: 'Tee', zh: '茶' },
    'green tea': { te: 'గ్రీన్ టీ', es: 'té verde', hi: 'ग्रीन टी', fr: 'thé vert', de: 'grüner Tee', zh: '绿茶' },
    'juice': { te: 'జ్యూస్', es: 'jugo', hi: 'जूस', fr: 'jus', de: 'Saft', zh: '果汁' },
    'orange juice': { te: 'ఆరెంజ్ జ్యూస్', es: 'jugo de naranja', hi: 'संतरे का रस', fr: "jus d'orange", de: 'Orangensaft', zh: '橙汁' },
    'smoothie': { te: 'స్మూతీ', es: 'batido', hi: 'स्मूदी', fr: 'smoothie', de: 'Smoothie', zh: '冰沙' },
    'water': { te: 'నీళ్ళు', es: 'agua', hi: 'पानी', fr: 'eau', de: 'Wasser', zh: '水' },

    // Condiments & Sweeteners
    'honey': { te: 'తేనె', es: 'miel', hi: 'शहद', fr: 'miel', de: 'Honig', zh: '蜂蜜' },
    'sugar': { te: 'చక్కెర', es: 'azúcar', hi: 'चीनी', fr: 'sucre', de: 'Zucker', zh: '糖' },
    'salt': { te: 'ఉప్పు', es: 'sal', hi: 'नमक', fr: 'sel', de: 'Salz', zh: '盐' },
    'olive oil': { te: 'ఆలివ్ ఆయిల్', es: 'aceite de oliva', hi: 'जैतून का तेल', fr: "huile d'olive", de: 'Olivenöl', zh: '橄榄油' },
    'coconut oil': { te: 'కొబ్బరి నూనె', es: 'aceite de coco', hi: 'नारियल तेल', fr: 'huile de coco', de: 'Kokosöl', zh: '椰子油' },
    'soy sauce': { te: 'సోయా సాస్', es: 'salsa de soja', hi: 'सोया सॉस', fr: 'sauce soja', de: 'Sojasauce', zh: '酱油' },

    // Meals & Dishes
    'salad': { te: 'సలాడ్', es: 'ensalada', hi: 'सलाद', fr: 'salade', de: 'Salat', zh: '沙拉' },
    'grilled chicken salad': { te: 'గ్రిల్డ్ చికెన్ సలాడ్', es: 'ensalada de pollo a la parrilla', hi: 'ग्रिल्ड चिकन सलाद', fr: 'salade de poulet grillé', de: 'Gegrilltes Hähnchen Salat', zh: '烤鸡沙拉' },
    'soup': { te: 'సూప్', es: 'sopa', hi: 'सूप', fr: 'soupe', de: 'Suppe', zh: '汤' },
    'sandwich': { te: 'శాండ్‌విచ్', es: 'sándwich', hi: 'सैंडविच', fr: 'sandwich', de: 'Sandwich', zh: '三明治' },
    'pizza': { te: 'పిజ్జా', es: 'pizza', hi: 'पिज्जा', fr: 'pizza', de: 'Pizza', zh: '披萨' },
    'burger': { te: 'బర్గర్', es: 'hamburguesa', hi: 'बर्गर', fr: 'hamburger', de: 'Burger', zh: '汉堡' },
    'steak': { te: 'స్టేక్', es: 'bistec', hi: 'स्टेक', fr: 'steak', de: 'Steak', zh: '牛排' },
    'curry': { te: 'కర్రీ', es: 'curry', hi: 'करी', fr: 'curry', de: 'Curry', zh: '咖喱' },
    'fried rice': { te: 'ఫ్రైడ్ రైస్', es: 'arroz frito', hi: 'फ्राइड राइस', fr: 'riz frit', de: 'gebratener Reis', zh: '炒饭' },
    'biryani': { te: 'బిర్యానీ', es: 'biryani', hi: 'बिरयानी', fr: 'biryani', de: 'Biryani', zh: '印度炒饭' },
    'dosa': { te: 'దోస', es: 'dosa', hi: 'डोसा', fr: 'dosa', de: 'Dosa', zh: '薄饼' },
    'idli': { te: 'ఇడ్లీ', es: 'idli', hi: 'इडली', fr: 'idli', de: 'Idli', zh: '米糕' },

    // Snacks
    'chips': { te: 'చిప్స్', es: 'papas fritas', hi: 'चिप्स', fr: 'chips', de: 'Chips', zh: '薯片' },
    'crackers': { te: 'క్రాకర్స్', es: 'galletas', hi: 'बिस्कुट', fr: 'crackers', de: 'Cracker', zh: '饼干' },
    'popcorn': { te: 'పాప్‌కార్న్', es: 'palomitas', hi: 'पॉपकॉर्न', fr: 'pop-corn', de: 'Popcorn', zh: '爆米花' },
    'chocolate': { te: 'చాక్లెట్', es: 'chocolate', hi: 'चॉकलेट', fr: 'chocolat', de: 'Schokolade', zh: '巧克力' },
    'ice cream': { te: 'ఐస్ క్రీమ్', es: 'helado', hi: 'आइसक्रीम', fr: 'glace', de: 'Eiscreme', zh: '冰淇淋' },
    'cookies': { te: 'కుకీస్', es: 'galletas', hi: 'कुकीज़', fr: 'biscuits', de: 'Kekse', zh: '饼干' },
    'cake': { te: 'కేక్', es: 'pastel', hi: 'केक', fr: 'gâteau', de: 'Kuchen', zh: '蛋糕' },
    'granola': { te: 'గ్రానోలా', es: 'granola', hi: 'ग्रेनोला', fr: 'granola', de: 'Granola', zh: '格兰诺拉' },
    'protein bar': { te: 'ప్రోటీన్ బార్', es: 'barra de proteína', hi: 'प्रोटीन बार', fr: 'barre protéinée', de: 'Proteinriegel', zh: '蛋白棒' },
};

/**
 * Get localized food name based on current locale
 * @param englishName - The food name in English
 * @param locale - The target locale (e.g., 'te', 'es', 'hi')
 * @returns The translated food name, or original if no translation exists
 */
export function getLocalizedFoodName(englishName: string, locale: string): string {
    if (!englishName || typeof englishName !== 'string') {
        return englishName || '';
    }

    // Normalize the input
    const normalized = englishName.toLowerCase().trim();
    const translations = foodTranslationDictionary[normalized];

    // 1. Exact locale match
    if (translations?.[locale]) {
        return translations[locale];
    }

    // 2. Language code fallback (e.g., te-IN -> te)
    const langCode = locale.split('-')[0];
    if (langCode !== locale && translations?.[langCode]) {
        return translations[langCode];
    }

    // 3. Check if it's a compound name (e.g., "Oatmeal with banana")
    const parts = normalized.split(/\s+with\s+|\s+and\s+/i);
    if (parts.length > 1) {
        const translatedParts = parts.map(part => {
            const partTranslations = foodTranslationDictionary[part.trim()];
            return partTranslations?.[locale] || partTranslations?.[langCode] || part.trim();
        });
        // Get connector word in target language
        const connector = locale === 'te' ? ' మరియు ' :
            locale === 'hi' ? ' और ' :
                locale === 'es' ? ' con ' :
                    locale === 'fr' ? ' avec ' :
                        locale === 'de' ? ' mit ' :
                            locale === 'zh' ? '和' : ' with ';
        return translatedParts.join(connector);
    }

    // 4. Fallback to original English name
    return englishName;
}

/**
 * Batch translate multiple food names
 * @param foodNames - Array of English food names
 * @param locale - Target locale
 * @returns Array of translated names
 */
export function getLocalizedFoodNames(foodNames: string[], locale: string): string[] {
    return foodNames.map(name => getLocalizedFoodName(name, locale));
}
